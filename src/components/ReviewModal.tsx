'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import StarRating from './StarRating';
import { notifyNewReview } from '@/lib/notifications';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  painterId: string;
  painterName: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
  onReviewSubmitted: () => void;
}

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  painterId, 
  painterName,
  existingReview,
  onReviewSubmitted 
}: ReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une note' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setMessage({ type: 'error', text: 'Vous devez être connecté' });
        setLoading(false);
        return;
      }

      if (existingReview) {
        // Mettre à jour l'avis existant
        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment: comment.trim() || null
          })
          .eq('id', existingReview.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Votre avis a été modifié avec succès !' });
      } else {
        // Créer un nouvel avis
        const { error } = await supabase
          .from('reviews')
          .insert({
            painter_id: painterId,
            student_id: user.id,
            rating,
            comment: comment.trim() || null
          });
		  // Créer une notification pour le formateur
await notifyNewReview({
  painterId,
  studentName: user.user_metadata?.full_name || user.email || 'Un utilisateur',
  rating: rating,
});

        if (error) throw error;
        setMessage({ type: 'success', text: 'Merci pour votre avis !' });
      }

      setTimeout(() => {
        onReviewSubmitted();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
        setMessage({ type: 'error', text: 'Vous avez déjà laissé un avis pour ce formateur' });
      } else {
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRating(existingReview?.rating || 0);
      setComment(existingReview?.comment || '');
      setMessage(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {existingReview ? 'Modifier mon avis' : 'Laisser un avis'}
          </h2>
          <p className="text-gray-600">
            Partagez votre expérience avec <strong>{painterName}</strong>
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.type === 'error' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Votre note <span className="text-red-500">*</span>
            </label>
            <div className="flex justify-center">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
              />
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                {rating === 1 && 'Décevant'}
                {rating === 2 && 'Passable'}
                {rating === 3 && 'Bien'}
                {rating === 4 && 'Très bien'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
              rows={4}
              placeholder="Partagez votre expérience avec ce formateur..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/500 caractères
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Envoi...
                </>
              ) : (
                existingReview ? 'Modifier' : 'Publier'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}