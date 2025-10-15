'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, MapPin, Clock, Euro, Filter, User as UserIcon, BookOpen, Palette } from 'lucide-react';
import Link from 'next/link';
import AuthModal from '@/components/AuthModal';
import UserMenu from '@/components/UserMenu';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import type { User } from '@supabase/supabase-js';
import Image from 'next/image';

interface Painter {
  id: string;
  name: string;
  bio: string;
  location: string;
  hourly_rate: number;
  availability: string;
  profile_image_url: string;
  status: string;
  styles: string[];
  levels: string[];
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

          return {
            ...painter,
            styles: stylesData?.map(s => s.style) || [],
            levels: levelsData?.map(l => l.level) || []
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

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
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
                <UserMenu user={user} />
              ) : (
                <>
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

                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{painter.levels.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{painter.availability}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Euro className="w-5 h-5 text-purple-600" />
                    <span className="text-2xl font-bold text-gray-800">{painter.hourly_rate}</span>
                    <span className="text-gray-500 text-sm">/heure</span>
                  </div>
                  <button 
                    onClick={() => user ? alert('Réservation à venir') : openAuthModal('signup')}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium"
                  >
                    Réserver
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
      />
    </div>
  );
}