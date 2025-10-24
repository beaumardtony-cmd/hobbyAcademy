'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Upload, Loader, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/Header'; // ✅ Import ajouté

interface Painter {
  id: string;
  name: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [painters, setPainters] = useState<Painter[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    style: '',
    painter_id: '',
  });

  const STYLES = ['Warhammer', 'Fantasy', 'Sci-Fi', 'Historique', 'Anime', 'Steampunk', 'Post-Apocalyptique'];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
    };

    const fetchPainters = async () => {
      const { data, error } = await supabase
        .from('painters')
        .select('id, name')
        .order('name');

      if (!error && data) {
        setPainters(data);
      }
    };

    checkUser();
    fetchPainters();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !imageFile) {
      alert('Veuillez vous connecter et sélectionner une image');
      return;
    }

    if (!formData.title.trim()) {
      alert('Veuillez entrer un titre');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload de l'image vers Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. Obtenir l'URL publique de l'image
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // 3. Créer le post dans la base de données
      const { error: insertError } = await supabase
        .from('gallery_posts')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          image_url: publicUrl,
          style: formData.style || null,
          painter_id: formData.painter_id || null,
        });

      if (insertError) throw insertError;

      // 4. Rediriger vers la galerie
      router.push('/gallery');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la publication. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-16 h-16 text-purple-600 animate-spin" />
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
            <Link href="/gallery">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-800">Partager une réalisation</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          {/* Upload d'image */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Photo de votre réalisation *
            </label>
            
            {imagePreview ? (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                <Image
                  src={imagePreview}
                  alt="Aperçu"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer bg-purple-50 hover:bg-purple-100 transition">
                <Upload className="w-12 h-12 text-purple-600 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Cliquez pour télécharger une image</p>
                <p className="text-xs text-gray-500">PNG, JPG jusqu&apos;à 10MB</p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* Titre */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Ex: Mon Space Marine Ultramarines"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              rows={4}
              placeholder="Parlez de votre réalisation, techniques utilisées, temps passé..."
            />
          </div>

          {/* Style */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Style
            </label>
            <select
              value={formData.style}
              onChange={(e) => setFormData({ ...formData, style: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="">Sélectionner un style</option>
              {STYLES.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          {/* Formateur */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Formateur associé
            </label>
            <select
              value={formData.painter_id}
              onChange={(e) => setFormData({ ...formData, painter_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="">Aucun formateur</option>
              {painters.map(painter => (
                <option key={painter.id} value={painter.id}>{painter.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Vous avez appris cette technique avec un formateur ? Mentionnez-le&nbsp;!
            </p>
          </div>

          {/* Boutons */}
          <div className="flex gap-4">
            <Link href="/gallery" className="flex-1">
              <button
                type="button"
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Annuler
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading || !imageFile}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Publication...
                </>
              ) : (
                'Publier'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}