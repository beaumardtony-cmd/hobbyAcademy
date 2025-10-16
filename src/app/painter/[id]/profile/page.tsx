'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, Clock, MessageCircle, Star, Heart, Loader, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import StarRating from '@/components/StarRating';
import ReviewModal from '@/components/ReviewModal';

interface PainterProfile {
  id: string;
  name: string;
  bio: string;
  location: string;
  availability: string;
  profile_image_url: string;
  user_id: string;
  styles: string[];
  levels: string[];
  average_rating: number;
  review_count: number;
  portfolio_images: { id: string; image_url: string; display_order: number }[];
  recent_reviews: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    student_name: string;
  }[];
}

export default function PainterProfilePage() {
  const params = useParams();
  const router = useRouter();
  const painterId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [painter, setPainter] = useState<PainterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const checkIfFavorite = useCallback(async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('painter_id', painterId)
        .single();

      setIsFavorite(!!data);
    } catch {
      setIsFavorite(false);
    }
  }, [user, painterId]);

  const fetchFavoritesCount = useCallback(async () => {
    try {
      const { count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('painter_id', painterId);

      setFavoritesCount(count || 0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  }, [painterId]);

  const fetchPainterProfile = useCallback(async () => {
    try {
      // Récupérer les infos du formateur
      const { data: painterData, error: painterError } = await supabase
        .from('painters')
        .select('*')
        .eq('id', painterId)
        .eq('status', 'approved')
        .single();

      if (painterError) throw painterError;
      if (!painterData) {
        router.push('/');
        return;
      }

      // Récupérer les styles
      const { data: stylesData } = await supabase
        .from('painter_styles')
        .select('style')
        .eq('painter_id', painterId);

      // Récupérer les niveaux
      const { data: levelsData } = await supabase
        .from('painter_levels')
        .select('level')
        .eq('painter_id', painterId);

      // Récupérer les stats d'avis
      const { data: ratingsData } = await supabase
        .from('painter_ratings')
        .select('average_rating, review_count')
        .eq('painter_id', painterId)
        .single();

      // Récupérer les images du portfolio
      const { data: portfolioData } = await supabase
        .from('painter_portfolio_images')
        .select('id, image_url, display_order')
        .eq('painter_id', painterId)
        .order('display_order', { ascending: true });

      // Récupérer les 3 derniers avis
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, student_id')
        .eq('painter_id', painterId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Pour chaque avis, récupérer le nom de l'étudiant
      const reviewsWithNames = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: { user: studentData } } = await supabase.auth.admin.getUserById(review.student_id);
          return {
            ...review,
            student_name: studentData?.user_metadata?.full_name || studentData?.email?.split('@')[0] || 'Utilisateur'
          };
        })
      );

      setPainter({
        ...painterData,
        styles: stylesData?.map(s => s.style) || [],
        levels: levelsData?.map(l => l.level) || [],
        average_rating: ratingsData?.average_rating || 0,
        review_count: ratingsData?.review_count || 0,
        portfolio_images: portfolioData || [],
        recent_reviews: reviewsWithNames
      });

      // Récupérer le nombre de favoris
      await fetchFavoritesCount();
    } catch (error) {
      console.error('Erreur:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [painterId, router, fetchFavoritesCount]);

  useEffect(() => {
    checkUser();
    fetchPainterProfile();
  }, [fetchPainterProfile]);

  useEffect(() => {
    if (user) {
      checkIfFavorite();
    }
  }, [user, checkIfFavorite]);

  // Tracker la vue du profil
  const trackProfileView = useCallback(async () => {
    if (!painterId) return;
    
    try {
      await supabase
        .from('profile_views')
        .insert({
          painter_id: painterId,
          viewer_id: user?.id || null
        });
    } catch {
      // Ignorer silencieusement les erreurs de tracking
    }
  }, [painterId, user]);

  useEffect(() => {
    if (painter) {
      trackProfileView();
    }
  }, [painter, trackProfileView]);

  const handleContactPainter = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour contacter ce formateur');
      return;
    }

    if (!painter) return;

    try {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('painter_id', painter.id)
        .eq('student_id', user.id)
        .single();

      if (existingConv) {
        router.push(`/messages/${existingConv.id}`);
      } else {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            painter_id: painter.id,
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

  const toggleFavorite = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour ajouter des favoris');
      return;
    }

    try {
      if (isFavorite) {
        // Retirer des favoris
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('painter_id', painterId);

        if (error) throw error;
        setIsFavorite(false);
        setFavoritesCount(prev => Math.max(0, prev - 1));
      } else {
        // Ajouter aux favoris
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            painter_id: painterId
          });

        if (error) throw error;
        setIsFavorite(true);
        setFavoritesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la gestion des favoris');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!painter) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Profil du formateur</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start gap-6 -mt-16">
              <Image
                src={painter.profile_image_url}
                alt={painter.name}
                width={160}
                height={160}
                className="rounded-full border-4 border-white shadow-xl"
              />
              
              <div className="flex-1 mt-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{painter.name}</h2>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="w-5 h-5" />
                      <span>{painter.location}</span>
                    </div>
                    {painter.review_count > 0 ? (
                      <div className="flex items-center gap-2">
                        <StarRating rating={Math.round(painter.average_rating)} readonly size="md" />
                        <span className="font-semibold text-gray-800">{painter.average_rating}</span>
                        <Link href={`/painter/${painter.id}/reviews`}>
                          <span className="text-purple-600 hover:text-purple-700 cursor-pointer">
                            ({painter.review_count} avis)
                          </span>
                        </Link>
                      </div>
                    ) : (
                      <span className="text-gray-500">Aucun avis pour le moment</span>
                    )}
                  </div>

                  <button
                    onClick={toggleFavorite}
                    className={`p-3 rounded-full transition ${
                      isFavorite 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {favoritesCount > 0 && (
                  <p className="text-sm text-gray-500 mb-3">
                    ❤️ {favoritesCount} personne{favoritesCount > 1 ? 's' : ''} {favoritesCount > 1 ? 'ont' : 'a'} ajouté ce formateur en favori
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {painter.styles.map(style => (
                    <span key={style} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {style}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleContactPainter}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contacter le formateur
                  </button>
                  {user && user.id !== painter.user_id && (
                    <button
                      onClick={() => setReviewModalOpen(true)}
                      className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition"
                    >
                      <Star className="w-5 h-5" />
                      Laisser un avis
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* À propos */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">À propos</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{painter.bio}</p>
            </div>

            {/* Portfolio */}
            {painter.portfolio_images.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Portfolio</h3>
                  <span className="text-sm text-gray-500">{painter.portfolio_images.length} photos</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {painter.portfolio_images.map((img) => (
                    <div 
                      key={img.id} 
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition group"
                      onClick={() => setSelectedImage(img.image_url)}
                    >
                      <Image
                        src={img.image_url}
                        alt="Portfolio"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Derniers avis */}
            {painter.recent_reviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Derniers avis</h3>
                  <Link href={`/painter/${painter.id}/reviews`}>
                    <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                      Voir tous les avis →
                    </button>
                  </Link>
                </div>
                <div className="space-y-4">
                  {painter.recent_reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-semibold">
                            {review.student_name[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{review.student_name}</span>
                        </div>
                        <StarRating rating={review.rating} readonly size="sm" />
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(review.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Informations</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Disponibilités</span>
                  </div>
                  <p className="text-gray-800 ml-6">{painter.availability}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Niveaux enseignés</p>
                  <div className="flex flex-wrap gap-2">
                    {painter.levels.map(level => (
                      <span key={level} className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium">
                        {level}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Tarifs</p>
                  <p className="text-gray-800">À discuter ensemble</p>
                </div>
              </div>
            </div>

            {/* Contact rapide */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-md p-6 text-white">
              <h3 className="text-lg font-bold mb-3">Prêt à commencer ?</h3>
              <p className="text-purple-100 text-sm mb-4">
                Contactez {painter.name.split(' ')[0]} pour discuter de vos objectifs et planifier votre premier cours !
              </p>
              <button
                onClick={handleContactPainter}
                className="w-full px-4 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition"
              >
                Envoyer un message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Portfolio"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
            >
              <ArrowLeft className="w-6 h-6 text-white rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        painterId={painter.id}
        painterName={painter.name}
        existingReview={null}
        onReviewSubmitted={() => {
          setReviewModalOpen(false);
          fetchPainterProfile();
        }}
      />
    </div>
  );
}