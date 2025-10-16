import { supabase } from './supabase';

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: 'message' | 'review' | 'favorite' | 'painter_approved' | 'painter_rejected';
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link: link || null,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    return false;
  }
}

// Notification pour nouveau message
export async function notifyNewMessage({
  recipientId,
  senderName,
  conversationId,
}: {
  recipientId: string;
  senderName: string;
  conversationId: string;
}) {
  return createNotification({
    userId: recipientId,
    type: 'message',
    title: 'Nouveau message',
    message: `${senderName} vous a envoyé un message`,
    link: `/messages/${conversationId}`,
  });
}

// Notification pour nouvel avis
export async function notifyNewReview({
  painterId,
  studentName,
  rating,
}: {
  painterId: string;
  studentName: string;
  rating: number;
}) {
  // Récupérer l'user_id du formateur
  const { data: painter } = await supabase
    .from('painters')
    .select('user_id, id')
    .eq('id', painterId)
    .single();

  if (!painter) return false;

  return createNotification({
    userId: painter.user_id,
    type: 'review',
    title: 'Nouvel avis',
    message: `${studentName} a laissé un avis (${rating}★)`,
    link: `/painter/${painter.id}/reviews`,
  });
}

// Notification pour ajout en favori
export async function notifyNewFavorite({
  painterId,
  studentName,
}: {
  painterId: string;
  studentName: string;
}) {
  // Récupérer l'user_id du formateur
  const { data: painter } = await supabase
    .from('painters')
    .select('user_id, id')
    .eq('id', painterId)
    .single();

  if (!painter) return false;

  return createNotification({
    userId: painter.user_id,
    type: 'favorite',
    title: 'Nouveau favori',
    message: `${studentName} vous a ajouté en favori`,
    link: `/painter/${painter.id}/profile`,
  });
}

// Notification pour candidature approuvée
export async function notifyPainterApproved({
  userId,
  painterName,
  painterId,
}: {
  userId: string;
  painterName: string;
  painterId: string;
}) {
  return createNotification({
    userId,
    type: 'painter_approved',
    title: 'Candidature approuvée ! 🎉',
    message: `Félicitations ${painterName} ! Votre profil de formateur a été approuvé.`,
    link: `/painter/${painterId}/profile`,
  });
}

// Notification pour candidature rejetée
export async function notifyPainterRejected({
  userId,
  painterName,
  reason,
}: {
  userId: string;
  painterName: string;
  reason: string;
}) {
  return createNotification({
    userId,
    type: 'painter_rejected',
    title: 'Candidature rejetée',
    message: `${painterName}, votre candidature a été rejetée. Raison: ${reason}`,
    link: '/become-painter',
  });
}