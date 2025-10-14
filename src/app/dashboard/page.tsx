'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Calendar, Palette, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('student');

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

    // Récupérer le rôle de l'utilisateur
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roles && roles.length > 0) {
      setUserRole(roles[0].role);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';
  const memberSince = new Date(user.created_at).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <Palette className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Mon Profil
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex items-end gap-6 -mt-16 mb-6">
              <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
                <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-4xl font-bold">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              </div>
              <div className="flex-1 mt-4">
                <h2 className="text-3xl font-bold text-gray-800 mb-1">{userName}</h2>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-600">Membre depuis</span>
                </div>
                <p className="font-semibold text-gray-800">{memberSince}</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Rôle</span>
                </div>
                <p className="font-semibold text-gray-800 capitalize">
                  {userRole === 'student' ? 'Élève' : userRole === 'painter' ? 'Formateur' : 'Administrateur'}
                </p>
              </div>

              <div className="bg-pink-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Palette className="w-5 h-5 text-pink-600" />
                  <span className="text-sm text-gray-600">Cours suivis</span>
                </div>
                <p className="font-semibold text-gray-800">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Link href="/my-courses">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Mes cours</h3>
                  <p className="text-sm text-gray-600">Voir tous mes cours réservés</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/become-painter">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">Devenir formateur</h3>
                  <p className="text-sm text-gray-600">Proposez vos propres cours</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Informations du compte</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
              <input
                type="text"
                value={userName}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Identifiant unique</label>
              <input
                type="text"
                value={user.id}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              Modifier mon profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}