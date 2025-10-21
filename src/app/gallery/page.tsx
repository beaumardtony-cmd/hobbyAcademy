'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Heart, MessageCircle, Plus, Loader, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface GalleryPost {
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
  comments_count: number;
  is_liked: boolean;
}

export default function GalleryPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('all');

  const STYLES = ['Tous', 'Warhammer', 'Fantasy', 'Sci-Fi', 'Historique', 'Anime', 'Steampunk', 'Post-Apocalyptique'];

  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        
        // 1. Charger l'utilisateur
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // 2. Récupérer tous les posts
        const { data: postsData, error } = await supabase
          .from('gallery_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!postsData || postsData.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // 3. Récupérer les painters
        const painterIds = [...new Set(postsData.map(p => p.painter_id).filter(Boolean))];
        
        let paintersMap = new Map();
        if (painterIds.length > 0) {
          const { data: paintersData } = await supabase
            .from('painters')
            .select('id, name')
            .in('id', painterIds);
          
          paintersMap = new Map(paintersData?.map(p => [p.id, p.name]) || []);
        }

        // 4. Récupérer tous les likes
        const postIds = postsData.map(p => p.id);
        const { data: likesData } = await supabase
          .from('gallery_likes')
          .select('post_id, user_id')
          .in('post_id', postIds);

        // Compter les likes par post
        const likesMap = new Map();
        postIds.forEach(id => likesMap.set(id, { count: 0, isLiked: false }));
        
        likesData?.forEach(like => {
          const current = likesMap.get(like.post_id);
          if (current) {
            current.count++;
            if (currentUser && like.user_id === currentUser.id) {
              current.isLiked = true;
            }
          }
        });

        // 5. Récupérer tous les commentaires
        const { data: commentsData } = await supabase
          .from('gallery_comments')
          .select('post_id')
          .in('post_id', postIds);

        // Compter les commentaires par post
        const commentsMap = new Map();
        postIds.forEach(id => commentsMap.set(id, 0));
        commentsData?.forEach(comment => {
          const current = commentsMap.get(comment.post_id);
          if (current !== undefined) {
            commentsMap.set(comment.post_id, current + 1);
          }
        });

        // 6. Assembler les données
        const postsWithDetails = postsData.map(post => {
          const likes = likesMap.get(post.id) || { count: 0, isLiked: false };
          const commentsCount = commentsMap.get(post.id) || 0;
          
          return {
            ...post,
            user_name: 'Utilisateur',
            painter_name: post.painter_id ? (paintersMap.get(post.painter_id) || null) : null,
            likes_count: likes.count,
            comments_count: commentsCount,
            is_liked: likes.isLiked,
          };
        });

        setPosts(postsWithDetails);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, []);

  const toggleLike = async (postId: string) => {
    if (!user) {
      alert('Veuillez vous connecter pour liker');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.is_liked) {
        await supabase
          .from('gallery_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        await supabase
          .from('gallery_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const filteredPosts = selectedStyle === 'all' 
    ? posts 
    : posts.filter(p => p.style === selectedStyle);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la galerie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              </Link>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-800">Galerie Communautaire</h1>
              </div>
            </div>
            {user && (
              <Link href="/gallery/new">
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium">
                  <Plus className="w-5 h-5" />
                  Partager
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtres */}
        <div className="mb-6 flex flex-wrap gap-2">
          {STYLES.map(style => (
            <button
              key={style}
              onClick={() => setSelectedStyle(style === 'Tous' ? 'all' : style)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                (style === 'Tous' && selectedStyle === 'all') || selectedStyle === style
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Grille de posts */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune réalisation</h3>
            <p className="text-gray-500 mb-6">Soyez le premier à partager votre création !</p>
            {user && (
              <Link href="/gallery/new">
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition">
                  Partager une réalisation
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <Link href={`/gallery/${post.id}`}>
                  <div className="relative aspect-square cursor-pointer group">
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/gallery/${post.id}`}>
                    <h3 className="font-bold text-lg text-gray-800 mb-2 hover:text-purple-600 cursor-pointer">
                      {post.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-semibold">
                      {post.user_name[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-600">{post.user_name}</span>
                  </div>

                  {post.painter_name && (
                    <p className="text-xs text-gray-500 mb-3">
                      Enseigné par <span className="font-medium text-purple-600">{post.painter_name}</span>
                    </p>
                  )}

                  {post.style && (
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium mb-3">
                      {post.style}
                    </span>
                  )}

                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleLike(post.id);
                      }}
                      className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition"
                    >
                      <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-red-600 text-red-600' : ''}`} />
                      <span className="text-sm font-medium">{post.likes_count}</span>
                    </button>
                    <Link href={`/gallery/${post.id}`}>
                      <button className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{post.comments_count}</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}