'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Eye, MessageCircle, Star, Heart, TrendingUp, Users, Award, Edit, Palette, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface PainterStats {
  painter_id: string;
  profile_views: number;
  messages_received: number;
  favorites_count: number;
  average_rating: number;
  review_count: number;
  last_7_days_views: number;
  last_30_days_views: number;
}

interface RecentActivity {
  type: 'view' | 'message' | 'favorite' | 'review';
  date: string;
  student_name?: string;
  rating?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPainter, setIsPainter] = useState(false);
  const [painterName, setPainterName] = useState('');
  const [painterId, setPainterId] = useState('');
  const [stats, setStats] = useState<PainterStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/');
      return;
    }

    setUser(user);

    // Vérifier si l'utilisateur est un formateur
    const { data: painterData } = await supabase
      .from('painters')
      .select('id, name, status')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single();

    if (painterData) {
      setIsPainter(true);
      setPainterId(painterData.id);
      setPainterName(painterData.name);
      await fetchStats(painterData.id);
      await fetchRecentActivities(painterData.id);
    } else {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const fetchStats = async (id: string) => {
    try {
      // Récupérer les statistiques principales
      const { data: ratingsData } = await supabase
        .from('painter_ratings')
        .select('average_rating, review_count')
        .eq('painter_id', id)
        .single();

      // Compter les favoris
      const { count: favoritesCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('painter_id', id);

      // Compter les messages reçus (conversations)
      const { count: messagesCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('painter_id', id);

      // Compter les vues de profil des 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: views7Days } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('painter_id', id)
        .gte('viewed_at', sevenDaysAgo.toISOString());

      // Compter les vues de profil des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: views30Days } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('painter_id', id)
        .gte('viewed_at', thirtyDaysAgo.toISOString());

      // Compter toutes les vues
      const { count: totalViews } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('painter_id', id);

      setStats({
        painter_id: id,
        profile_views: totalViews || 0,
        messages_received: messagesCount || 0,
        favorites_count: favoritesCount || 0,
        average_rating: ratingsData?.average_rating || 0,
        review_count: ratingsData?.review_count || 0,
        last_7_days_views: views7Days || 0,
        last_30_days_views: views30Days || 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async (id: string) => {
    try {
      const activities: RecentActivity[] = [];

      // Récupérer les derniers avis
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('created_at, rating, student_id')
        .eq('painter_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reviewsData) {
        for (const review of reviewsData) {
          const { data: { user: studentData } } = await supabase.auth.admin.getUserById(review.student_id);
          activities.push({
            type: 'review',
            date: review.created_at,
            rating: review.rating,
            student_name: studentData?.user_metadata?.full_name || studentData?.email?.split('@')[0] || 'Utilisateur'
          });
        }
      }

      // Récupérer les derniers favoris
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('created_at, user_id')
        .eq('painter_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (favoritesData) {
        for (const favorite of favoritesData) {
          const { data: { user: userData } } = await supabase.auth.admin.getUserById(favorite.user_id);
          activities.push({
            type: 'favorite',
            date: favorite.created_at,
            student_name: userData?.user_metadata?.full_name || userData?.email?.split('@')[0] || 'Utilisateur'
          });
        }
      }

      // Trier par date décroissante
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Il y a quelques minutes';
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Award className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Dashboard Élève
  if (!isPainter) {
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
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Mon Tableau de bord</h1>
                  <p className="text-sm text-gray-600">Bienvenue, {user?.user_metadata?.full_name || user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Actions principales */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link href="/" className="block">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-purple-200">
                <Search className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-bold text-gray-800 mb-1">Trouver un formateur</h3>
                <p className="text-sm text-gray-600">Découvrez nos formateurs experts</p>
              </div>
            </Link>

            <Link href="/messages" className="block">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-purple-200">
                <MessageCircle className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-800 mb-1">Mes Messages</h3>
                <p className="text-sm text-gray-600">Contactez vos formateurs</p>
              </div>
            </Link>

            <Link href="/favorites" className="block">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-purple-200">
                <Heart className="w-8 h-8 text-red-600 mb-3" />
                <h3 className="font-bold text-gray-800 mb-1">Mes Favoris</h3>
                <p className="text-sm text-gray-600">Formateurs favoris</p>
              </div>
            </Link>
          </div>

          {/* Devenir formateur */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <Palette className="w-12 h-12" />
              <div>
                <h2 className="text-2xl font-bold mb-1">Vous êtes passionné de peinture ?</h2>
                <p className="text-purple-100">Partagez votre savoir-faire et devenez formateur sur notre plateforme</p>
              </div>
            </div>
            <Link href="/become-painter">
              <button className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition">
                Devenir formateur
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Formateur
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Tableau de bord formateur</h1>
                <p className="text-sm text-gray-600">Bienvenue, {painterName}</p>
              </div>
            </div>
            <Link href={`/painter/${painterId}/profile`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium">
                <Edit className="w-4 h-4" />
                Voir mon profil
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Vues du profil */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs text-green-600 font-medium">
                +{stats?.last_7_days_views} cette semaine
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats?.profile_views}</h3>
            <p className="text-sm text-gray-600">Vues du profil</p>
          </div>

          {/* Messages reçus */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats?.messages_received}</h3>
            <p className="text-sm text-gray-600">Conversations</p>
          </div>

          {/* Favoris */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats?.favorites_count}</h3>
            <p className="text-sm text-gray-600">Favoris</p>
          </div>

          {/* Note moyenne */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {stats && stats.average_rating > 0 ? stats.average_rating.toFixed(1) : '-'}
            </h3>
            <p className="text-sm text-gray-600">{stats?.review_count} avis</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Graphique des vues */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Évolution des vues</h2>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">7 derniers jours</span>
                  <span className="text-lg font-bold text-gray-800">{stats?.last_7_days_views}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${stats ? Math.min((stats.last_7_days_views / Math.max(stats.last_30_days_views, 1)) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">30 derniers jours</span>
                  <span className="text-lg font-bold text-gray-800">{stats?.last_30_days_views}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                    style={{ width: `${stats ? Math.min((stats.last_30_days_views / Math.max(stats.profile_views, 1)) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <span className="text-lg font-bold text-gray-800">{stats?.profile_views}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-500 to-red-500 w-full" />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Conseil</h4>
                  <p className="text-sm text-blue-700">
                    Votre profil est vu en moyenne {stats ? Math.round(stats.last_30_days_views / 30) : 0} fois par jour. 
                    Gardez votre profil à jour et répondez rapidement aux messages pour améliorer votre visibilité !
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activités récentes */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Activités récentes</h2>
            
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">Aucune activité récente</p>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      activity.type === 'review' ? 'bg-yellow-100' :
                      activity.type === 'favorite' ? 'bg-red-100' :
                      activity.type === 'message' ? 'bg-purple-100' :
                      'bg-blue-100'
                    }`}>
                      {activity.type === 'review' && <Star className="w-4 h-4 text-yellow-600" />}
                      {activity.type === 'favorite' && <Heart className="w-4 h-4 text-red-600" />}
                      {activity.type === 'message' && <MessageCircle className="w-4 h-4 text-purple-600" />}
                      {activity.type === 'view' && <Eye className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium">
                        {activity.type === 'review' && (
                          <>
                            <span className="font-semibold">{activity.student_name}</span> a laissé un avis
                            {activity.rating && (
                              <span className="ml-1">({activity.rating} ⭐)</span>
                            )}
                          </>
                        )}
                        {activity.type === 'favorite' && (
                          <>
                            <span className="font-semibold">{activity.student_name}</span> vous a ajouté en favori
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <Link href="/messages" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-purple-200">
              <MessageCircle className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">Messages</h3>
              <p className="text-sm text-gray-600">Répondre aux élèves</p>
            </div>
          </Link>

          <Link href={`/painter/${painterId}/reviews`} className="block">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-purple-200">
              <Star className="w-8 h-8 text-yellow-600 mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">Avis</h3>
              <p className="text-sm text-gray-600">Voir tous mes avis</p>
            </div>
          </Link>

          <Link href={`/painter/${painterId}/profile`} className="block">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-purple-200">
              <Users className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-gray-800 mb-1">Mon profil</h3>
              <p className="text-sm text-gray-600">Mettre à jour mon profil</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}