'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import type { Conversation } from '@/types/supabase';

export default function MessagesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = '/';
      return;
    }

    setUser(user);
    await fetchConversations(user.id);
  };

  const fetchConversations = async (userId: string) => {
    try {
      // Récupérer les conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`student_id.eq.${userId},painter_id.in.(select id from painters where user_id = ${userId})`)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      // Pour chaque conversation, récupérer les infos du formateur/élève
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          // Récupérer les infos du formateur
          const { data: painterData } = await supabase
            .from('painters')
            .select('name, profile_image_url, user_id')
            .eq('id', conv.painter_id)
            .single();

          // Récupérer les infos de l'élève
          const { data: { user: studentData } } = await supabase.auth.admin.getUserById(conv.student_id);

          // Compter les messages non lus
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', userId);

          return {
            ...conv,
            painter_name: painterData?.name,
            painter_image: painterData?.profile_image_url,
            student_name: studentData?.user_metadata?.full_name || studentData?.email,
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return `Il y a ${days} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune conversation</h3>
            <p className="text-gray-500 mb-6">Contactez un formateur pour commencer une conversation</p>
            <Link href="/">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition">
                Trouver un formateur
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {conversations.map((conv) => {
              const isPainter = user?.id && conv.painter_id;
              const otherPersonName = isPainter ? conv.student_name : conv.painter_name;
              const otherPersonImage = conv.painter_image;

              return (
                <Link key={conv.id} href={`/messages/${conv.id}`}>
                  <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition border-b border-gray-100 cursor-pointer">
                    <div className="relative">
                      {otherPersonImage ? (
                        <Image
                          src={otherPersonImage}
                          alt={otherPersonName || 'User'}
                          width={56}
                          height={56}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                          {(otherPersonName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      {conv.unread_count && conv.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {conv.unread_count}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{otherPersonName}</h3>
                      <p className="text-sm text-gray-500">
                        Cliquez pour ouvrir la conversation
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(conv.last_message_at)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}