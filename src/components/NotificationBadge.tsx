'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

interface NotificationBadgeProps {
  user: User | null;
}

export default function NotificationBadge({ user }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Charger le nombre de notifications non lues
    fetchUnreadCount();

    // S'abonner aux nouvelles notifications en temps réel
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnreadCount]);

  if (!user) return null;

  return (
    <Link href="/notifications">
      <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </Link>
  );
}