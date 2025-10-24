'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Loader } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { MessageType } from '@/types/supabase';
import ReviewModal from '@/components/ReviewModal';
import { notifyNewMessage } from '@/lib/notifications';
import Header from '@/components/Header'; // ✅ Import ajouté

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherPerson, setOtherPerson] = useState<{ name: string, image?: string } | null>(null);
  const [painterInfo, setPainterInfo] = useState<{ id: string, name: string } | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const markMessagesAsRead = useCallback(async () => {
    if (!user) return;
    
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('read', false)
      .neq('sender_id', user.id);
  }, [user, conversationId]);

  const fetchConversationDetails = useCallback(async (userId: string) => {
    try {
      const { data: conv } = await supabase
        .from('conversations')
        .select('painter_id, student_id')
        .eq('id', conversationId)
        .single();

      if (!conv) return;

      if (conv.student_id === userId) {
        const { data: painter } = await supabase
          .from('painters')
          .select('name, profile_image_url')
          .eq('id', conv.painter_id)
          .single();

        if (painter) {
          setOtherPerson({ name: painter.name, image: painter.profile_image_url });
          setPainterInfo({ id: conv.painter_id, name: painter.name });
        }
      } else {
        const { data: { user: studentData } } = await supabase.auth.admin.getUserById(conv.student_id);
        if (studentData) {
          setOtherPerson({ name: studentData.user_metadata?.full_name || studentData.email || 'Utilisateur' });
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }, [conversationId]);

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = '/';
      return;
    }

    setUser(user);
    await fetchConversationDetails(user.id);
  }, [fetchConversationDetails]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (user) {
      fetchMessages();
      markMessagesAsRead();
      
      const channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as MessageType]);
            if (payload.new.sender_id !== user.id) {
              markMessagesAsRead();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, conversationId, fetchMessages, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      
      // Créer une notification pour le destinataire
      // Récupérer l'info de la conversation pour savoir qui est le destinataire
      const { data: conv } = await supabase
        .from('conversations')
        .select('painter_id, student_id')
        .eq('id', conversationId)
        .single();
      
      if (conv) {
        // Si le destinataire est un painter, on prend son user_id
        if (conv.student_id === user.id) {
          // Je suis l'élève, le destinataire est le formateur
          const { data: painter } = await supabase
            .from('painters')
            .select('user_id')
            .eq('id', conv.painter_id)
            .single();
          
          if (painter) {
            await notifyNewMessage({
              recipientId: painter.user_id,
              senderName: user.user_metadata?.full_name || user.email || 'Un utilisateur',
              conversationId,
            });
          }
        } else {
          // Je suis le formateur, le destinataire est l'élève
          await notifyNewMessage({
            recipientId: conv.student_id,
            senderName: user.user_metadata?.full_name || user.email || 'Un utilisateur',
            conversationId,
          });
        }
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement de la conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/50 flex flex-col">
      {/* ✅ Nouveau Header réutilisable */}
      <Header user={user} />

      {/* Sous-header avec info conversation */}
      {otherPerson && (
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/messages">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
              </Link>
              
              {otherPerson.image ? (
                <Image
                  src={otherPerson.image}
                  alt={otherPerson.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold border border-gray-300">
                  {otherPerson.name[0].toUpperCase()}
                </div>
              )}
              <h2 className="text-lg font-bold text-slate-800">{otherPerson.name}</h2>
              
              {/* Bouton Laisser un avis (uniquement pour les élèves) */}
              {painterInfo && user?.id !== painterInfo.id && (
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="ml-auto px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                >
                  Laisser un avis
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Aucun message. Commencez la conversation !</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      isOwn 
                        ? 'bg-gradient-to-r from-slate-500 to-slate-700 text-white' 
                        : 'bg-white text-slate-800 shadow-md'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <p className={`text-xs text-slate-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={sendMessage} className="flex items-end gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-gradient-to-r from-slate-500 to-slate-700 text-white rounded-xl hover:from-slate-300 hover:to-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Review Modal */}
      {painterInfo && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          painterId={painterInfo.id}
          painterName={painterInfo.name}
          existingReview={null}
          onReviewSubmitted={() => {
            setReviewModalOpen(false);
          }}
        />
      )}
    </div>
  );
}