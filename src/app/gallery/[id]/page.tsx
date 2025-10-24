'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Heart, MessageCircle, Send, Loader, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/Header'; // ✅ Import ajouté

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
  comment: string;
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

  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        
        // 1. Charger l'utilisateur
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // 2. Récupérer le post
        const { data: postData, error } = await supabase
          .from('gallery_posts')
          .select('*')
          .eq('id', postId)
          .single();

        if (error) throw error;

        // 3. Récupérer le painter si présent
        let painterName = null;
        if (postData.painter_id) {
          const { data: painterData } = await supabase
            .from('painters')
            .select('name')
            .eq('id', postData.painter_id)
            .single();
          painterName = painterData?.name;
        }

        // 4. Compter les likes
        const { count: likesCount } = await supabase
          .from('gallery_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        // 5. Vérifier si l'utilisateur a liké
        let isLiked = false;
        if (currentUser) {
          const { data: likeData } = await supabase
            .from('gallery_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', currentUser.id)
            .maybeSingle();
          isLiked = !!likeData;
        }

        setPost({
          ...postData,
          user_name: 'Utilisateur',
          painter_name: painterName,
          likes_count: likesCount || 0,
          is_liked: isLiked,
        });

        // 6. Charger les commentaires
        const { data: commentsData, error: commentsError } = await supabase
          .from('gallery_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (!commentsError && commentsData) {
          const commentsWithDetails = commentsData.map(comment => ({
            ...comment,
            user_name: 'Utilisateur',
            is_owner: currentUser?.id === comment.user_id,
          }));

          setComments(commentsWithDetails);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [postId]);

  const reloadComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('gallery_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithDetails = (commentsData || []).map(comment => ({
        ...comment,
        user_name: 'Utilisateur',
        is_owner: user?.id === comment.user_id,
      }));

      setComments(commentsWithDetails);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

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
          comment: commentText,
        });

      if (error) throw error;

      setCommentText('');
      await reloadComments();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'envoi du commentaire');
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

      await reloadComments();
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

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-16 h-16 text-slate-600 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Post introuvable</h2>
          <Link href="/gallery">
            <button className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-700 text-white rounded-lg hover:from-slate-300 hover:to-slate-500 transition">
              Retour à la galerie
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* ✅ Nouveau Header réutilisable */}
      <Header user={user} />

      {/* ✅ Section bouton retour conservée pour le contexte */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/gallery">
            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Retour à la galerie</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image du post */}
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

          {/* Détails et commentaires */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-800 mb-4">{post.title}</h1>

              <div className="flex items-center gap-3 mb-4">
                {/* Avatar principal du post - style gris cohérent */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold border border-gray-300">
                  {post.user_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{post.user_name}</p>
                  <p className="text-sm text-slate-500">{formatDate(post.created_at)}</p>
                </div>
              </div>

              {post.description && (
                <p className="text-slate-700 mb-4 whitespace-pre-wrap">{post.description}</p>
              )}

              {post.style && (
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium mb-4">
                  {post.style}
                </span>
              )}

              {post.painter_name && (
                <p className="text-sm text-slate-600">
                  Enseigné par <span className="font-semibold text-slate-700">{post.painter_name}</span>
                </p>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                <button
                  onClick={toggleLike}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group"
                >
                  <Heart className={`w-6 h-6 transition-colors ${post.is_liked ? 'fill-slate-400 text-slate-400' : 'group-hover:text-slate-300'}`} />
                  <span className="font-medium group-hover:text-slate-300 transition-colors">{post.likes_count}</span>
                </button>
                <div className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group cursor-default">
                  <MessageCircle className="w-6 h-6 group-hover:text-slate-300 transition-colors" />
                  <span className="font-medium group-hover:text-slate-300 transition-colors">{comments.length}</span>
                </div>
              </div>
            </div>

            {/* Section commentaires */}
            <div className="flex-1 flex flex-col border-t border-slate-100 pt-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Commentaires ({comments.length})
              </h3>

              <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-h-96">
                {comments.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Aucun commentaire pour le moment</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {/* Avatar des commentaires - style gris cohérent */}
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-sm font-semibold border border-gray-300">
                            {comment.user_name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{comment.user_name}</p>
                            <p className="text-xs text-slate-500">{formatDate(comment.created_at)}</p>
                          </div>
                        </div>
                        {comment.is_owner && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-slate-400 hover:text-slate-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Formulaire de commentaire */}
              {user ? (
                <form onSubmit={submitComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-700 text-white rounded-lg hover:from-slate-300 hover:to-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-600 mb-2">Connectez-vous pour commenter</p>
                  <Link href="/">
                    <button className="px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-700 text-white rounded-lg hover:from-slate-300 hover:to-slate-500 transition text-sm font-medium">
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