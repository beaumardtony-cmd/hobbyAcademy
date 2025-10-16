'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Heart, MessageCircle, Send, Loader, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface Post {
  id: string;
  user_id: string;
  painter_id: string | null;
  title: string;
  description: string | null;
  image_url: string;
  style: string | null;
  created_at: string;
  user_name: string;
  painter_name: string | null;
  likes_count: number;
  is_liked: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_name: string;
  is_owner: boolean;
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }, []);

  const fetchPost = useCallback(async () => {
    try {
      const { data: postData, error } = await supabase
        .from('gallery_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      const { data: { user: userData } } = await supabase.auth.admin.getUserById(postData.user_id);
      
      let painterName = null;
      if (postData.painter_id) {
        const { data: painterData } = await supabase
          .from('painters')
          .select('name')
          .eq('id', postData.painter_id)
          .single();
        painterName = painterData?.name;
      }

      const { count: likesCount } = await supabase
        .from('gallery_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      let isLiked = false;
      if (user) {
        const { data: likeData } = await supabase
          .from('gallery_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();
        isLiked = !!likeData;
      }

      setPost({
        ...postData,
        user_name: userData?.user_metadata?.full_name || userData?.email?.split('@')[0] || 'Utilisateur',
        painter_name: painterName,
        likes_count: likesCount || 0,
        is_liked: isLiked,
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  const fetchComments = useCallback(async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('gallery_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithDetails = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: { user: userData } } = await supabase.auth.admin.getUserById(comment.user_id);
          
          return {
            ...comment,
            user_name: userData?.user_metadata?.full_name || userData?.email?.split('@')[0] || 'Utilisateur',
            is_owner: user?.id === comment.user_id,
          };
        })
      );

      setComments(commentsWithDetails);
    } catch (error) {
      console.error('Erreur:', error);
    }
  }, [postId, user]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (user !== null) {
      fetchPost();
      fetchComments();
    }
  }, [user, fetchPost, fetchComments]);

  const toggleLike = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour liker');
      return;
    }

    if (!post) return;

    try {
      if (post.is_liked) {
        await supabase
          .from('gallery_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setPost({ ...post, is_liked: false, likes_count: post.likes_count - 1 });
      } else {
        await supabase
          .from('gallery_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        setPost({ ...post, is_liked: true, likes_count: post.likes_count + 1 });
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Veuillez vous connecter pour commenter');
      return;
    }

    if (!commentText.trim()) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('gallery_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: commentText,
        });

      if (error) throw error;

      setCommentText('');
      await fetchComments();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l&apos;envoi du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce commentaire ?')) return;

    try {
      const { error } = await supabase
        .from('gallery_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l&apos;instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-16 h-16 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Post introuvable</h2>
          <Link href="/gallery">
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              Retour à la galerie
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/gallery">
            <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour à la galerie</span>
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                  {post.user_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{post.user_name}</p>
                  <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
                </div>
              </div>

              {post.description && (
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.description}</p>
              )}

              {post.style && (
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                  {post.style}
                </span>
              )}

              {post.painter_name && (
                <p className="text-sm text-gray-600">
                  Enseigné par <span className="font-semibold text-purple-600">{post.painter_name}</span>
                </p>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                <button
                  onClick={toggleLike}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
                >
                  <Heart className={`w-6 h-6 ${post.is_liked ? 'fill-red-600 text-red-600' : ''}`} />
                  <span className="font-medium">{post.likes_count}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-medium">{comments.length}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Commentaires ({comments.length})
              </h3>

              <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-96">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucun commentaire pour le moment</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {comment.user_name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{comment.user_name}</p>
                            <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                          </div>
                        </div>
                        {comment.is_owner && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-red-600 hover:text-red-700 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              {user ? (
                <form onSubmit={submitComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">Connectez-vous pour commenter</p>
                  <Link href="/login">
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
                      Se connecter
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}