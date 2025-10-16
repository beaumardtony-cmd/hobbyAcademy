'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, MapPin, Filter, User as UserIcon, BookOpen, Palette, MessageCircle, Star, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import AuthModal from '@/components/AuthModal';
import UserMenu from '@/components/UserMenu';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import type { User } from '@supabase/supabase-js';
import Image from 'next/image';
import NotificationBadge from '@/components/NotificationBadge';
import AvailabilityDisplay from '@/components/AvailabilityDisplay';

interface Painter {
  id: string;
  name: string;
  bio: string;
  location: string;
  availability: string;
  profile_image_url: string;
  status: string;
  styles: string[];
  levels: string[];
  user_id?: string;
  average_rating?: number;
  review_count?: number;
}

export default function Home() {
  const [painters, setPainters] = useState<Painter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  useEffect(() => {
    fetchPainters();
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPainters = async () => {
    try {
      const { data: paintersData, error: paintersError } = await supabase
        .from('painters')
        .select('*')
        .eq('status', 'approved');

      if (paintersError) throw paintersError;

      const paintersWithDetails = await Promise.all(
        (paintersData || []).map(async (painter) => {
          const { data: stylesData } = await supabase
            .from('painter_styles')
            .select('style')
            .eq('painter_id', painter.id);

          const { data: levelsData } = await supabase
            .from('painter_levels')
            .select('level')
            .eq('painter_id', painter.id);

          // Récupérer les statistiques d'avis
          const { data: ratingsData } = await supabase
            .from('painter_ratings')
            .select('average_rating, review_count')
            .eq('painter_id', painter.id)
            .single();

          return {
            ...painter,
            styles: stylesData?.map(s => s.style) || [],
            levels: levelsData?.map(l => l.level) || [],
            average_rating: ratingsData?.average_rating || 0,
            review_count: ratingsData?.review_count || 0
          };
        })
      );

      setPainters(paintersWithDetails);
    } catch (error) {
      console.error('Erreur lors du chargement des formateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPainters = painters.filter(painter => {
    const matchesSearch = painter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         painter.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         painter.styles.some(style => style.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLevel = selectedLevel === 'all' || painter.levels.includes(selectedLevel) || painter.levels.includes('Tous niveaux');
    const matchesStyle = selectedStyle === 'all' || painter.styles.includes(selectedStyle);
    
    return matchesSearch && matchesLevel && matchesStyle;
  });

  const handleContactPainter = async (painter: Painter) => {
    if (!user) {
      openAuthModal('signup');
      return;
    }

    // Créer ou récupérer la conversation
    try {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('painter_id', painter.id)
        .eq('student_id', user.id)
        .single();

      if (existingConv) {
        window.location.href = `/messages/${existingConv.id}`;
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
        window.location.href = `/messages/${newConv.id}`;
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ouverture de la conversation');
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setForgotPasswordOpen(false);
  };

  const openForgotPassword = () => {
    setAuthModalOpen(false);
    setForgotPasswordOpen(true);
  };

  const backToLogin = () => {
    setForgotPasswordOpen(false);
    setAuthModalOpen(true);
    setAuthMode('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Palette className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement des formateurs...</p>
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
            <Link href="/" className="flex items-center gap-2">
              <Palette className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                PaintMini Academy
              </h1>
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <NotificationBadge user={user} />
                  <Link href="/gallery">
                    <button className="relative p-2 hover:bg-gray-100 rounded-lg transition" title="Galerie">
                      <ImageIcon className="w-6 h-6 text-gray-700" />
                    </button>
                  </Link>
                  <Link href="/messages">
                    <button className="relative p-2 hover:bg-gray-100 rounded-lg transition" title="Messages">
                      <MessageCircle className="w-6 h-6 text-gray-700" />
                    </button>
                  </Link>
                  <UserMenu user={user} />
                </>
              ) : (
                <>
                  <Link href="/gallery">
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-purple-600 transition font-medium">
                      <ImageIcon className="w-4 h-4" />
                      Galerie
                    </button>
                  </Link>
                  <button 
                    onClick={() => openAuthModal('login')}
                    className="px-4 py-2 text-gray-700 hover:text-purple-600 transition font-medium"
                  >
                    Se connecter
                  </button>
                  <button 
                    onClick={() => openAuthModal('signup')}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    <UserIcon className="w-4 h-4" />
                    S&apos;inscrire
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-3">Apprenez la peinture de figurines</h2>
          <p className="text-lg text-purple-100 mb-8">Trouvez le formateur parfait près de chez vous</p>
          
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un formateur, style ou ville..."
                className="flex-1 outline-none text-gray-800 py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
            >
              <Filter className="w-4 h-4" />
              Filtres
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-lg p-4 mt-2 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  <option value="all">Tous les niveaux</option>
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                >
                  <option value="all">Tous les styles</option>
                  <option value="Warhammer">Warhammer</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                  <option value="Historique">Historique</option>
                  <option value="Anime">Anime</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {filteredPainters.length} formateur{filteredPainters.length > 1 ? 's' : ''} disponible{filteredPainters.length > 1 ? 's' : ''}
          </h3>
          <p className="text-gray-600">Choisissez votre professeur idéal pour commencer votre apprentissage</p>
        </div>

        {/* Painters Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPainters.map(painter => (
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
                        className="rounded-full bg-purple-100"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-800 mb-1">{painter.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{painter.location}</span>
                        </div>
                        {painter.review_count && painter.review_count > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-gray-800">{painter.average_rating}</span>
                            <span className="text-gray-500 text-sm">({painter.review_count} avis)</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Aucun avis</span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{painter.bio}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {painter.styles.map(style => (
                        <span key={style} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {style}
                        </span>
                      ))}
                    </div>

                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                        <BookOpen className="w-4 h-4" />
                        <span>{painter.levels.join(', ')}</span>
                      </div>
                      
                      <AvailabilityDisplay 
                        availability={painter.availability} 
                        compact={true}
                      />
                    </div>
                  </div>
                </Link>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {painter.review_count && painter.review_count > 0 && (
                      <span className="text-purple-600 font-medium">
                        {painter.review_count} avis
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleContactPainter(painter);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contacter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPainters.length === 0 && (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun formateur trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
        onForgotPassword={openForgotPassword}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        onBackToLogin={backToLogin}
      />
    </div>
  );
}