'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Loader, Star, Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { Review } from '@/types/supabase';
import StarRating from '@/components/StarRating';
import ReviewModal from '@/components/ReviewModal';
import Header from '@/components/Header'; // ✅ Import ajouté

export default function PainterReviewsPage() {
  const params = useParams();
  const painterId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [painterName, setPainterName] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPainterInfo = useCallback(async () => {
    const { data } = await supabase
      .from('painters')
      .select('name')
      .eq('id', painterId)
      .single();

    if (data) setPainterName(data.name);
  }, [painterId]);

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('painter_id', painterId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Pour chaque avis, récupérer les infos de l'élève
      const reviewsWithStudentInfo = await Promise.all(
        (data || []).map(async (review) => {
          const { data: { user: studentData } } = await supabase.auth.admin.getUserById(review.student_id);
          return {
            ...review,
            student_name: studentData?.user_metadata?.full_name || studentData?.email?.split('@')[0] || 'Utilisateur',
            student_image: studentData?.user_metadata?.avatar_url
          };
        })
      );

      setReviews(reviewsWithStudentInfo);

      // Calculer les statistiques
      if (reviewsWithStudentInfo.length > 0) {
        const avg = reviewsWithStudentInfo.reduce((sum, r) => sum + r.rating, 0) / reviewsWithStudentInfo.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setReviewCount(reviewsWithStudentInfo.length);
      }

      // Vérifier si l'utilisateur a déjà laissé un avis
      if (user) {
        const existingReview = reviewsWithStudentInfo.find(r => r.student_id === user.id);
        setUserReview(existingReview || null);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [painterId, user]);

  useEffect(() => {
    checkUser();
    fetchPainterInfo();
    fetchReviews();
  }, [painterId, fetchPainterInfo, fetchReviews]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre avis ?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setUserReview(null);
      fetchReviews();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des avis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* ✅ Nouveau Header réutilisable */}
      <Header user={user} />

      {/* ✅ Section titre conservée pour le contexte de la page */}
      <div className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/painter/${painterId}/profile`}>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Avis sur {painterName}</h1>
              <p className="text-sm text-gray-600">{reviewCount} avis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-5xl font-bold text-gray-800">{averageRating || '-'}</span>
                <div>
                  <StarRating rating={Math.round(averageRating)} readonly size="lg" />
                  <p className="text-sm text-gray-600 mt-1">{reviewCount} avis</p>
                </div>
              </div>
            </div>
            {user && !userReview && (
              <button
                onClick={() => setReviewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium"
              >
                <Plus className="w-4 h-4" />
                Laisser un avis
              </button>
            )}
          </div>

          {/* Distribution des étoiles */}
          <div className="mt-6 space-y-2">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = reviews.filter(r => r.rating === stars).length;
              const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-12">{stars} ⭐</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun avis</h3>
              <p className="text-gray-500">Soyez le premier à laisser un avis !</p>
            </div>
          ) : (
            reviews.map((review) => {
              const isOwnReview = user && review.student_id === user.id;

              return (
                <div key={review.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                        {(review.student_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {review.student_name || 'Utilisateur'}
                          {isOwnReview && <span className="text-purple-600 ml-2">(Vous)</span>}
                        </h4>
                        <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} readonly size="sm" />
                      {isOwnReview && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setReviewModalOpen(true)}
                            className="p-1 hover:bg-gray-100 rounded transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-1 hover:bg-red-50 rounded transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        painterId={painterId}
        painterName={painterName}
        existingReview={userReview}
        onReviewSubmitted={() => {
          fetchReviews();
          checkUser();
        }}
      />
    </div>
  );
}