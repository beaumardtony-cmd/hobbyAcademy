'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Heart, Loader, MapPin, Star, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface FavoritePainter {
  favorite_id: string;
  id: string;
  name: string;
  bio: string;
  location: string;
  profile_image_url: string;
  styles: string[];
  average_rating: number;
  review_count: number;
  added_at: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<FavoritePainter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async (userId: string) => {
    try {
      // Récupérer les favoris de l'utilisateur
      const { data: favoritesData, error: favError } = await supabase
        .from('favorites')
        .select('id, painter_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (favError) throw favError;

      // Pour chaque favori, récupérer les détails du formateur
      const paintersDetails = await Promise.all(
        (favoritesData || []).map(async (fav) => {
          const { data: painter } = await supabase
            .from('painters')
            .select('*')
            .eq('id', fav.painter_id)
            .eq('status', 'approved')
            .single();

          if (!painter) return null;

          // Récupérer les styles
          const { data: stylesData } = await supabase
            .from('painter_styles')
            .select('style')
            .eq('painter_id', painter.id);

          // Récupérer les stats
          const { data: ratingsData } = await supabase
            .from('painter_ratings')
            .select('average_rating, review_count')
            .eq('painter_id', painter.id)
            .single();

          return {
            favorite_id: fav.id,
            ...painter,
            styles: stylesData?.map(s => s.style) || [],
            average_rating: ratingsData?.average_rating || 0,
            review_count: ratingsData?.review_count || 0,
            added_at: fav.created_at
          };
        })
      );

      // Filtrer les null (formateurs supprimés ou non approuvés)
      setFavorites(paintersDetails.filter(p => p !== null) as FavoritePainter[]);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/');
      return;
    }

    setUser(user);
    await fetchFavorites(user.id);
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.favorite_id !== favoriteId));
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleContactPainter = async (painterId: string) => {
    if (!user) return;

    try {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('painter_id', painterId)
        .eq('student_id', user.id)
        .single();

      if (existingConv) {
        router.push(`/messages/${existingConv.id}`);
      } else {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            painter_id: painterId,
            student_id: user.id
          })
          .select()
          .single();

        if (error) throw error;
        router.push(`/messages/${newConv.id}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ouverture de la conversation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de vos favoris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-600 fill-current" />
              <h1 className="text-2xl font-bold text-gray-800">Mes Favoris</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun favori</h3>
            <p className="text-gray-500 mb-6">Commencez à ajouter des formateurs à vos favoris pour les retrouver facilement</p>
            <Link href="/">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition">
                Découvrir les formateurs
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Vous avez <strong>{favorites.length}</strong> formateur{favorites.length > 1 ? 's' : ''} en favori
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((painter) => (
                <div key={painter.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden">
                  <div className="p-6">
                    <Link href={`/painter/${painter.id}/profile`}>
                      <div className="cursor-pointer">
                        <div className="flex items-start gap-4 mb-4">
                          <Image
                            src={painter.profile_image_url}
                            alt={painter.name}
                            width={64}
                            height={64}
                            className="rounded-full"
                          />
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-800 mb-1">{painter.name}</h4>
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>{painter.location}</span>
                            </div>
                            {painter.review_count > 0 ? (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-gray-800">{painter.average_rating}</span>
                                <span className="text-gray-500 text-sm">({painter.review_count})</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Aucun avis</span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{painter.bio}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {painter.styles.slice(0, 3).map(style => (
                            <span key={style} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {style}
                            </span>
                          ))}
                          {painter.styles.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              +{painter.styles.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleContactPainter(painter.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition text-sm font-medium"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Contacter
                      </button>
                      <button
                        onClick={() => removeFavorite(painter.favorite_id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                        title="Retirer des favoris"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Ajouté le {new Date(painter.added_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}