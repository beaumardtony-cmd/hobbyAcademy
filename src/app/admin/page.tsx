'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, CheckCircle, XCircle, AlertCircle, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

interface Painter {
  id: string;
  name: string;
  bio: string;
  location: string;
  hourly_rate: number;
  availability: string;
  profile_image_url: string;
  status: string;
  submitted_date: string;
  rejection_reason?: string;
  styles: string[];
  levels: string[];
}

export default function AdminPage() {
  const [painters, setPainters] = useState<Painter[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedPainter, setSelectedPainter] = useState<Painter | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ... reste du code identique

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = '/';
      return;
    }

    setUser(user);

    // Vérifier si l'utilisateur est admin (optionnel)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roles) {
      setIsAdmin(true);
      fetchAllPainters();
    } else {
      // Pour le moment, on permet l'accès à tous les utilisateurs connectés
      // Vous pouvez changer cela plus tard
      setIsAdmin(true);
      fetchAllPainters();
    }
  };

  const fetchAllPainters = async () => {
    try {
      const { data: paintersData, error: paintersError } = await supabase
        .from('painters')
        .select('*')
        .order('submitted_date', { ascending: false });

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
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const approvePainter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('painters')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      setPainters(painters.map(p => 
        p.id === id ? { ...p, status: 'approved' } : p
      ));
      alert('Formateur approuvé avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const rejectPainter = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Veuillez indiquer une raison de rejet');
      return;
    }

    try {
      const { error } = await supabase
        .from('painters')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason 
        })
        .eq('id', id);

      if (error) throw error;

      setPainters(painters.map(p => 
        p.id === id ? { ...p, status: 'rejected', rejection_reason: rejectionReason } : p
      ));
      setRejectionReason('');
      setSelectedPainter(null);
      alert('Formateur rejeté');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du rejet');
    }
  };

  const pendingPainters = painters.filter(p => p.status === 'pending');
  const approvedPainters = painters.filter(p => p.status === 'approved');
  const rejectedPainters = painters.filter(p => p.status === 'rejected');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement du panneau admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Administration PaintMini</h1>
                <p className="text-purple-200 text-sm">Modération des annonces</p>
              </div>
            </div>
            <Link href="/">
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
                Retour au site
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">En attente</p>
                <p className="text-3xl font-bold text-orange-600">{pendingPainters.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Approuvées</p>
                <p className="text-3xl font-bold text-green-600">{approvedPainters.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Rejetées</p>
                <p className="text-3xl font-bold text-red-600">{rejectedPainters.length}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Annonces en attente de modération</h2>
          {pendingPainters.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Tout est à jour !</h3>
              <p className="text-gray-500">Aucune annonce en attente de modération</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPainters.map(painter => (
                <div key={painter.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <img 
                        src={painter.profile_image_url} 
                        alt={painter.name}
                        className="w-20 h-20 rounded-full bg-purple-100"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-xl text-gray-800 mb-1">{painter.name}</h4>
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                              <MapPin className="w-4 h-4" />
                              <span>{painter.location}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              Soumis le {new Date(painter.submitted_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                            En attente
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-700 mb-3">{painter.bio}</p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Styles : </span>
                          <span className="text-gray-600">{painter.styles.join(', ')}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Niveaux : </span>
                          <span className="text-gray-600">{painter.levels.join(', ')}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Tarif : </span>
                          <span className="text-gray-600">{painter.hourly_rate}€/heure</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Disponibilité : </span>
                          <span className="text-gray-600">{painter.availability}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => approvePainter(painter.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approuver
                      </button>
                      <button
                        onClick={() => setSelectedPainter(painter)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                      >
                        <XCircle className="w-5 h-5" />
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Annonces approuvées ({approvedPainters.length})</h2>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Formateur</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Localisation</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tarif</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {approvedPainters.map(painter => (
                    <tr key={painter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={painter.profile_image_url} alt={painter.name} className="w-10 h-10 rounded-full" />
                          <span className="font-medium text-gray-800">{painter.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{painter.location}</td>
                      <td className="px-6 py-4 text-gray-600">{painter.hourly_rate}€/h</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          Publié
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {rejectedPainters.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Annonces rejetées ({rejectedPainters.length})</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Formateur</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Raison du rejet</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rejectedPainters.map(painter => (
                      <tr key={painter.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={painter.profile_image_url} alt={painter.name} className="w-10 h-10 rounded-full" />
                            <span className="font-medium text-gray-800">{painter.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{painter.rejection_reason}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                            Rejeté
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedPainter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Rejeter l&apos;annonce</h3>
            <p className="text-gray-600 mb-4">
              Vous êtes sur le point de rejeter l&apos;annonce de <strong>{selectedPainter.name}</strong>. 
              Veuillez indiquer la raison :
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 h-32 resize-none"
              placeholder="Ex: Informations incomplètes, tarif non conforme, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedPainter(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => rejectPainter(selectedPainter.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}