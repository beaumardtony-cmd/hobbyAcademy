import Link from 'next/link';
import { Palette, User as UserIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import UserMenu from '@/components/UserMenu';
import NotificationBadge from '@/components/NotificationBadge';

interface HeaderProps {
  user?: User | null;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  showAuthButtons?: boolean;
}

export default function Header({ user, onLoginClick, onSignupClick, showAuthButtons = true }: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center group-hover:from-slate-500 group-hover:to-slate-700 transition-all duration-300">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
              Hobby Academy
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NotificationBadge user={user} />
                <UserMenu user={user} />
              </>
            ) : showAuthButtons ? (
              <>
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                  Se connecter
                </button>
                <button 
                  onClick={onSignupClick}
                  className="flex items-center gap-2 bg-gradient-to-r from-slate-500 to-slate-700 text-white px-4 py-2 rounded-lg hover:from-slate-300 hover:to-slate-500 transition-all shadow-sm hover:shadow-md"
                >
                  <UserIcon className="w-4 h-4" />
                  S&apos;inscrire
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}