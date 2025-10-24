'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MessageCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/Header'; // ✅ Import ajouté

interface Conversation {
  id: string;
  painter_id: string;
  student_id: string;
  last_message_at: string;
  other_person_name: string;
  other_person_image?: string;
  last_message?: string;
  unread_count: number;
}

export default function MessagesListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/');
      return;
    }

    setUser(user);
  }, [router]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      // Récupérer toutes les conversations de l'utilisateur
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`painter_id.eq.${user.id},student_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      // Pour chaque conversation, récupérer les infos de l'autre personne
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          const isStudent = conv.student_id === user.id;
          let otherPersonName = 'Utilisateur';
          let otherPersonImage: string | undefined;

          if (isStudent) {
            // Je suis l'élève, récupérer le formateur
            const { data: painter } = await supabase
              .from('painters')
              .select('name, profile_image_url')
              .eq('id', conv.painter_id)
              .single();
            
            if (painter) {
              otherPersonName = painter.name;
              otherPersonImage = painter.profile_image_url;
            }
          } else {
            // Je suis le formateur, récupérer l'élève
            const { data: { user: studentData } } = await supabase.auth.admin.getUserById(conv.student_id);
            if (studentData) {
              otherPersonName = studentData.user_metadata?.full_name || studentData.email || 'Utilisateur';
            }
          }

          // Récupérer le dernier message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Compter les messages non lus
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            other_person_name: otherPersonName,
            other_person_image: otherPersonImage,
            last_message: lastMsg?.content,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/50">
      {/* ✅ Nouveau Header réutilisable */}
      <Header user={user} />

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Mes conversations
              </h2>
              <Link href="/">
                <button className="flex items-center gap-2 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Retour</span>
                </button>
              </Link>
            </div>
          </div>

          {conversations.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg mb-2">Aucune conversation</p>
              <p className="text-slate-500 text-sm mb-6">
                Contactez un formateur pour commencer une conversation
              </p>
              <Link href="/">
                <button className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-700 text-white rounded-lg font-semibold hover:from-slate-300 hover:to-slate-500 transition">
                  Trouver un formateur
                </button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {conversations.map((conv) => (
                <Link key={conv.id} href={`/messages/${conv.id}`}>
                  <div className="p-4 hover:bg-slate-50 transition cursor-pointer">
                    <div className="flex items-center gap-4">
                      {conv.other_person_image ? (
                        <Image
                          src={conv.other_person_image}
                          alt={conv.other_person_name}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold border border-gray-300">
                          {conv.other_person_name[0].toUpperCase()}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-slate-800 truncate">
                            {conv.other_person_name}
                          </h3>
                          <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                            {formatDate(conv.last_message_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 truncate">
                          {conv.last_message || 'Aucun message'}
                        </p>
                      </div>

                      {conv.unread_count > 0 && (
                        <div className="flex-shrink-0 w-6 h-6 bg-slate-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}