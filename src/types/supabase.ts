import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

// Utiliser directement le type de Supabase au lieu de le redéfinir
export type User = SupabaseAuthUser;

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export interface UserMenuProps {
  user: User;
}

export interface Message {
  type: 'error' | 'success';
  text: string;
}