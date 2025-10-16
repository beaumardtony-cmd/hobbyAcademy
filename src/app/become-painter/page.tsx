'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle, Loader, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';

const STYLES = ['Warhammer', 'Fantasy', 'Sci-Fi', 'Historique', 'Anime', 'Steampunk', 'Post-Apocalyptique'];
const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux'];

export default function BecomePainterPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [alreadyPainter, setAlreadyPainter] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [portfolioImages, setPortfolioImages] = useState<File[]>([]);
  const [portfolioImagesPreviews, setPortfolioImagesPreviews] = useState<string[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = '/';
      return;
    }

    setUser(user);
    setName(user.user_metadata?.full_name || '');

    // Vérifier si l'utilisateur est déjà formateur
    const { data: existingPainter } = await supabase
      .from('painters')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (existingPainter) {
      setAlreadyPainter(true);
      setMessage({
        type: existingPainter.status === 'pending' ? 'error' : 'success',
        text: existingPainter.status === 'pending' 
          ? 'Votre demande est en cours de validation par notre équipe.'
          : 'Vous êtes déjà inscrit en tant que formateur !'
      });
    }

    setLoading(false);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille du fichier ne doit pas dépasser 5 MB');
        return;
      }
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePortfolioImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + portfolioImages.length > 10) {
      alert('Vous pouvez uploader maximum 10 images');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} dépasse 5 MB`);
        return false;
      }
      return true;
    });

    setPortfolioImages([...portfolioImages, ...validFiles]);
    setPortfolioImagesPreviews([
      ...portfolioImagesPreviews,
      ...validFiles.map(file => URL.createObjectURL(file))
    ]);
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
    setPortfolioImagesPreviews(portfolioImagesPreviews.filter((_, i) => i !== index));
  };

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  const toggleLevel = (level: string) => {
    if (selectedLevels.includes(level)) {
      setSelectedLevels(selectedLevels.filter(l => l !== level));
    } else {
      setSelectedLevels([...selectedLevels, level]);
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('painter-portfolios')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('painter-portfolios')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erreur upload:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    // Validations
    if (!name.trim() || !bio.trim() || !location.trim()) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' });
      setSubmitting(false);
      return;
    }

    if (selectedStyles.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins un style' });
      setSubmitting(false);
      return;
    }

    if (selectedLevels.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins un niveau' });
      setSubmitting(false);
      return;
    }

    try {
      // Upload de l'image de profil
      let profileImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;
      if (profileImage) {
        const uploadedUrl = await uploadImage(profileImage, `${user?.id}/profile`);
        if (uploadedUrl) profileImageUrl = uploadedUrl;
      }

      // Créer le profil de formateur
      const { data: painterData, error: painterError } = await supabase
        .from('painters')
        .insert({
          user_id: user?.id,
          name: name.trim(),
          bio: bio.trim(),
          location: location.trim(),
          availability: availability.trim() || 'À discuter',
          profile_image_url: profileImageUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (painterError) throw painterError;

      // Ajouter les styles
      const stylesData = selectedStyles.map(style => ({
        painter_id: painterData.id,
        style: style
      }));
      
      const { error: stylesError } = await supabase
        .from('painter_styles')
        .insert(stylesData);

      if (stylesError) throw stylesError;

      // Ajouter les niveaux
      const levelsData = selectedLevels.map(level => ({
        painter_id: painterData.id,
        level: level
      }));

      const { error: levelsError } = await supabase
        .from('painter_levels')
        .insert(levelsData);

      if (levelsError) throw levelsError;

      // Upload des images du portfolio
      if (portfolioImages.length > 0) {
        const uploadedUrls = await Promise.all(
          portfolioImages.map(file => 
            uploadImage(file, `${user?.id}/portfolio`)
          )
        );

        const portfolioData = uploadedUrls
          .filter(url => url !== null)
          .map((url, index) => ({
            painter_id: painterData.id,
            image_url: url!,
            display_order: index
          }));

        if (portfolioData.length > 0) {
          await supabase
            .from('painter_portfolio_images')
            .insert(portfolioData);
        }
      }

      setMessage({
        type: 'success',
        text: 'Votre candidature a été soumise avec succès ! Notre équipe va l\'examiner sous 48h.'
      });

      setAlreadyPainter(true);

      // Scroll vers le haut
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({
        type: 'error',
        text: 'Une erreur est survenue lors de la soumission'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Devenir Formateur</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
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

        {alreadyPainter ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Candidature envoyée !</h2>
            <p className="text-gray-600 mb-6">
              Notre équipe examine votre profil et vous contactera sous 48h.
            </p>
            <Link href="/dashboard">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition">
                Retour au profil
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Informations de base</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    placeholder="Jean Dupont"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio / Présentation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
                    rows={5}
                    placeholder="Parlez de votre expérience, votre passion pour la peinture de figurines..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{bio.length} caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localisation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    placeholder="Paris, 75011"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponibilités
                  </label>
                  <input
                    type="text"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    placeholder="Week-ends, soirs de semaine..."
                  />
                </div>
              </div>
            </div>

            {/* Styles enseignés */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Styles enseignés <span className="text-red-500">*</span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {STYLES.map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedStyles.includes(style)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Niveaux enseignés */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Niveaux enseignés <span className="text-red-500">*</span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevel(level)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedLevels.includes(level)
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Image de profil */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Photo de profil</h2>
              <div className="space-y-4">
                {profileImagePreview ? (
                  <div className="relative w-32 h-32 mx-auto">
                    <Image
                      src={profileImagePreview}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileImage(null);
                        setProfileImagePreview('');
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Cliquez pour uploader</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-gray-500 text-center">Maximum 5 MB • JPG, PNG</p>
              </div>
            </div>

            {/* Portfolio */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Portfolio <span className="text-sm font-normal text-gray-500">(Maximum 10 images)</span>
              </h2>
              
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition">
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Cliquez pour ajouter des photos de vos travaux</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePortfolioImagesChange}
                    className="hidden"
                  />
                </label>

                {portfolioImagesPreviews.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {portfolioImagesPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square">
                        <Image
                          src={preview}
                          alt={`Portfolio ${index + 1}`}
                          fill
                          className="rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePortfolioImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link href="/dashboard">
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Soumettre ma candidature
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}