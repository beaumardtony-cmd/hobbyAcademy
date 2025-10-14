'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Settings, Palette, Shield } from 'lucide-react';
import Link from 'next/link';

interface UserMenuProps {
  user: any;
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
          {getInitials(userName)}
        </div>
        <span className="hidden md:block text-gray-700 font-medium">
          {userName}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-semibold text-gray-800">{userName}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>

          <div className="py-2">
            <Link href="/dashboard">
              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700">
                <User className="w-5 h-5" />
                <span>Mon profil</span>
              </button>
            </Link>

            <Link href="/my-courses">
              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700">
                <Palette className="w-5 h-5" />
                <span>Mes cours</span>
              </button>
            </Link>

            <Link href="/admin">
              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700">
                <Shield className="w-5 h-5" />
                <span>Administration</span>
              </button>
            </Link>

            <Link href="/settings">
              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-3 text-gray-700">
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