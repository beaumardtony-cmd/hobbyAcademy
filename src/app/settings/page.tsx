'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User as UserIcon, Mail, Lock, Save, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import Header from '@/components/Header';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Message states
  const [profileMessage, setProfileMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

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
    setFullName(user.user_metadata?.full_name || '');
    setEmail(user.email || '');
    setLoading(false);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMessage(null);

    try {
      const updates: { data?: { full_name: string }, email?: string } = {};
      
      // Mise à jour du nom
      if (fullName !== user?.user_metadata?.full_name) {
        updates.data = { full_name: fullName };
      }

      // Mise à jour de l'email
      if (email !== user?.email) {
        updates.email = email;
      }

      if (Object.keys(updates).length === 0) {
        setProfileMessage({
          type: 'error',
          text: 'Aucune modification détectée'
        });
        setSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      setProfileMessage({
        type: 'success',
        text: email !== user?.email 
          ? 'Profil mis à jour ! Vérifiez votre email pour confirmer la nouvelle adresse.'
          : 'Profil mis à jour avec succès !'
      });

      // Rafraîchir les données utilisateur
      setTimeout(() => {
        checkUser();
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setProfileMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setPasswordMessage(null);

    // Validations
    if (newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Les mots de passe ne correspondent pas'
      });
      setSaving(false);
      return;
    }

    try {
      // Vérifier le mot de passe actuel en tentant une connexion
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordMessage({
        type: 'success',
        text: 'Mot de passe modifié avec succès !'
      });

      // Réinitialiser les champs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setPasswordMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/50">
      {/* ✅ Header réutilisable - remplace les 13 lignes de code du header personnalisé */}
      <Header user={user} showAuthButtons={false} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Paramètres du compte</h1>
          <p className="text-slate-600 mt-2">Gérez vos informations personnelles et votre sécurité</p>
        </div>

        {/* Profile Information Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <UserIcon className="w-6 h-6 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-800">Informations personnelles</h2>
          </div>

          {profileMessage && (
            <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
              profileMessage.type === 'error' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {profileMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition"
                placeholder="Jean Dupont"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition"
                  placeholder="votre@email.com"
                  required
                />
              </div>
              {email !== user.email && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Vous devrez confirmer votre nouvelle adresse email
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-700 text-white rounded-lg font-semibold hover:from-slate-600 hover:to-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-800">Changer le mot de passe</h2>
          </div>

          {passwordMessage && (
            <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
              passwordMessage.type === 'error' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {passwordMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe actuel
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Minimum 6 caractères
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Password strength indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        newPassword.length < 6 ? 'w-1/3 bg-red-500' :
                        newPassword.length < 10 ? 'w-2/3 bg-yellow-500' :
                        'w-full bg-green-500'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    newPassword.length < 6 ? 'text-red-600' :
                    newPassword.length < 10 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {newPassword.length < 6 ? 'Faible' :
                     newPassword.length < 10 ? 'Moyen' :
                     'Fort'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-700 text-white rounded-lg font-semibold hover:from-slate-600 hover:to-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Changer le mot de passe
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6 border border-slate-200/60">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Informations du compte</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Identifiant unique</span>
              <span className="text-slate-800 font-mono text-xs">{user.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Compte créé le</span>
              <span className="text-slate-800">
                {new Date(user.created_at || Date.now()).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">Dernière connexion</span>
              <span className="text-slate-800">
                {user.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}