'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Settings, Palette, Shield, MessageCircle, Heart } from 'lucide-react';
import Link from 'next/link';
import type { UserMenuProps } from '@/types/supabase';

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`student_id.eq.${user.id},painter_id.in.(select id from painters where user_id = ${user.id})`);

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = conversations.map(c => c.id);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('read', false)
        .neq('sender_id', user.id);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Erreur lors du comptage des messages non lus:', error);
    }
  }, [user.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnreadCount]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition relative"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
          {getInitials(userName)}
        </div>
        <span className="hidden md:block text-gray-700 font-medium">
          {userName}
        </span>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-semibold text-gray-800">{userName}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>

          <div className="py-2">
            <Link href="/dashboard">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
              >
                <User className="w-5 h-5" />
                <span>Mon profil</span>
              </button>
            </Link>

            <Link href="/favorites">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
              >
                <Heart className="w-5 h-5" />
                <span>Mes favoris</span>
              </button>
            </Link>

            <Link href="/messages">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center justify-between text-gray-700"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5" />
                  <span>Messages</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </Link>

            <Link href="/my-courses">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
              >
                <Palette className="w-5 h-5" />
                <span>Mes cours</span>
              </button>
            </Link>

            <Link href="/admin">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
              >
                <Shield className="w-5 h-5" />
                <span>Administration</span>
              </button>
            </Link>

            <Link href="/settings">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700"
              >
                <Settings className="w-5 h-5" />
                <span>Paramètres</span>
              </button>
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left hover:bg-red-50 transition flex items-center gap-3 text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}