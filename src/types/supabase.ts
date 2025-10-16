import type { User as SupabaseAuthUser } from '@supabase/supabase-js';

// Utiliser directement le type de Supabase au lieu de le redéfinir
export type User = SupabaseAuthUser;

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  onForgotPassword?: () => void;
}

export interface UserMenuProps {
  user: User;
}

export interface Message {
  type: 'error' | 'success';
  text: string;
}

export interface Conversation {
  id: string;
  painter_id: string;
  student_id: string;
  last_message_at: string;
  created_at: string;
  painter_name?: string;
  student_name?: string;
  painter_image?: string;
  unread_count?: number;
}

export interface MessageType {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  painter_id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  student_name?: string;
  student_image?: string;
}
export interface Favorite {
  id: string;
  user_id: string;
  painter_id: string;
  created_at: string;
}