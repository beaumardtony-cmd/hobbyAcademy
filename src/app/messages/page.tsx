'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Paperclip, FileIcon, Download, Loader } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import FileUpload from '@/components/FileUpload';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  created_at: string;
  is_mine: boolean;
}

interface Conversation {
  id: string;
  painter_id: string;
  student_id: string;
  other_user_name: string;
  other_user_role: string;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversation');

  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(conversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    return user;
  }, []);

  const fetchConversations = useCallback(async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`painter_id.eq.${currentUser.id},student_id.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithUsers = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.painter_id === currentUser.id ? conv.student_id : conv.painter_id;
          const otherUserRole = conv.painter_id === currentUser.id ? 'Élève' : 'Formateur';

          const { data: { user: otherUser } } = await supabase.auth.admin.getUserById(otherUserId);

          return {
            ...conv,
            other_user_name: otherUser?.user_metadata?.full_name || otherUser?.email?.split('@')[0] || 'Utilisateur',
            other_user_role: otherUserRole,
          };
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (convId: string, currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithOwnership = (data || []).map(msg => ({
        ...msg,
        is_mine: msg.sender_id === currentUser.id,
      }));

      setMessages(messagesWithOwnership);
    } catch (error) {
      console.error('Erreur:', error);
    }
  }, []);

  const updateTypingStatus = useCallback(async (convId: string, userId: string, isTyping: boolean) => {
    try {
      if (isTyping) {
        await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: convId,
            user_id: userId,
            updated_at: new Date().toISOString(),
          });
      } else {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', convId)
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Erreur typing:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const currentUser = await checkUser();
      if (currentUser) {
        await fetchConversations(currentUser);
        if (conversationId) {
          setSelectedConversation(conversationId);
          await fetchMessages(conversationId, currentUser);
        }
      }
    };
    init();
  }, [checkUser, fetchConversations, fetchMessages, conversationId]);

  // Subscription aux nouveaux messages
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          const newMsg = {
            ...payload.new,
            is_mine: payload.new.sender_id === user.id,
          } as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  // Subscription au typing indicator
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const channel = supabase
      .channel(`typing:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new.user_id !== user.id) {
              setOtherUserTyping(true);
              setTimeout(() => setOtherUserTyping(false), 3000);
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old.user_id !== user.id) {
              setOtherUserTyping(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  const handleTyping = useCallback(() => {
    if (!selectedConversation || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(selectedConversation, user.id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(selectedConversation, user.id, false);
    }, 2000);
  }, [selectedConversation, user, isTyping, updateTypingStatus]);

  const sendMessage = async (content?: string, fileData?: { url: string; type: string; name: string }) => {
    if (!selectedConversation || !user) return;
    if (!content?.trim() && !fileData) return;

    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content: content || null,
        attachment_url: fileData?.url || null,
        attachment_type: fileData?.type || null,
        attachment_name: fileData?.name || null,
      });

      if (error) throw error;

      setNewMessage('');
      if (isTyping) {
        setIsTyping(false);
        updateTypingStatus(selectedConversation, user.id, false);
      }

      // Mettre à jour la conversation
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const bucket = file.type.startsWith('image/') ? 'images' : 'files';
      const filePath = `messages/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      await sendMessage(undefined, {
        url: publicUrl,
        type: file.type,
        name: file.name,
      });

      setShowFileUpload(false);
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload du fichier');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.created_at).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-16 h-16 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour</span>
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Liste des conversations */}
          <div className="bg-white rounded-xl shadow-lg p-4 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Conversations</h2>
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune conversation</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv.id);
                      if (user) fetchMessages(conv.id, user);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedConversation === conv.id
                        ? 'bg-purple-100 border-2 border-purple-600'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <p className="font-semibold text-gray-800">{conv.other_user_name}</p>
                    <p className="text-sm text-gray-500">{conv.other_user_role}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zone de messages */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-lg flex flex-col">
            {selectedConversation ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {Object.entries(groupMessagesByDate(messages)).map(([date, msgs]) => (
                    <div key={date}>
                      <div className="flex items-center justify-center my-4">
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                          {formatDate(msgs[0].created_at)}
                        </span>
                      </div>
                      {msgs.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'} mb-3`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.is_mine
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {msg.attachment_url && (
                              <div className="mb-2">
                                {msg.attachment_type?.startsWith('image/') ? (
                                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                                    <Image
                                      src={msg.attachment_url}
                                      alt={msg.attachment_name || 'Image'}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <a
                                    href={msg.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                                  >
                                    <FileIcon className="w-5 h-5" />
                                    <span className="text-sm truncate flex-1">{msg.attachment_name}</span>
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                            <p className={`text-xs mt-1 ${msg.is_mine ? 'text-white/70' : 'text-gray-500'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {otherUserTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFileUpload(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Écrivez votre message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || (!newMessage.trim())}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
                  >
                    {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFileUpload && (
        <FileUpload
          onFileSelect={handleFileUpload}
          onCancel={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-16 h-16 text-purple-600 animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}