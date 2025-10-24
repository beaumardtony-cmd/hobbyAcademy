# 📚 Documentation Complète - Hobby Academy

## 📖 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Structure du projet](#structure-du-projet)
4. [Composants réutilisables](#composants-réutilisables)
5. [Fonctionnalités par module](#fonctionnalités-par-module)
6. [Base de données](#base-de-données)
7. [Design System](#design-system)
8. [Authentification](#authentification)
9. [Routes et navigation](#routes-et-navigation)

---

## 🎯 Vue d'ensemble

### Concept
**Hobby Academy** est une plateforme de mise en relation entre formateurs de peinture de figurines et élèves. Elle permet aux passionnés de trouver des professeurs qualifiés près de chez eux et de réserver des cours personnalisés.

### Rôles utilisateurs
- **👤 Élève** : Recherche et contacte des formateurs, laisse des avis
- **👨‍🎨 Formateur** : Propose des cours, gère son profil et ses disponibilités
- **⚙️ Admin** : Modère la plateforme, valide les formateurs

### Technologies
- **Framework** : Next.js 14+ (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS (nuances de gris + accent bleu-gris)
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Hébergement** : Vercel
- **Icons** : Lucide React

---

## 🏗️ Architecture technique

### Stack technique complète
```
Frontend:
- Next.js 14+ (React 18+)
- TypeScript 5+
- Tailwind CSS 3+
- Lucide React (icons)

Backend:
- Supabase (BaaS)
- PostgreSQL
- Real-time subscriptions
- Storage pour images

Déploiement:
- Vercel (frontend)
- Supabase Cloud (backend)
```

### Patterns utilisés
- Server Components par défaut
- Client Components pour interactivité
- Route Handlers pour API
- Middleware pour protection routes
- Real-time avec Supabase subscriptions

---

## 📁 Structure du projet

```
hobbyAcademy/
├── .github/workflows/       # CI/CD GitHub Actions
├── e2e/                     # Tests E2E Playwright
├── public/                  # Assets statiques
├── src/
│   ├── app/                 # Pages (App Router)
│   │   ├── admin/          # Panel administration
│   │   ├── auth/callback/  # Callback OAuth
│   │   ├── become-painter/ # Candidature formateur
│   │   ├── dashboard/      # Dashboard formateur
│   │   ├── favorites/      # Favoris utilisateur
│   │   ├── gallery/        # Galerie des œuvres
│   │   ├── messages/       # Messagerie
│   │   ├── notifications/  # Centre notifications
│   │   ├── painter/[id]/   # Profil formateur
│   │   ├── reset-password/ # Réinitialisation MDP
│   │   ├── settings/       # Paramètres compte
│   │   ├── favicon.ico
│   │   ├── globals.css     # Styles globaux + thème gris
│   │   ├── layout.tsx      # Layout racine
│   │   └── page.tsx        # Page d'accueil
│   ├── components/          # Composants réutilisables
│   │   ├── AdvancedFilters.tsx
│   │   ├── AuthModal.tsx
│   │   ├── AvailabilityDisplay.tsx
│   │   ├── FileUpload.tsx
│   │   ├── ForgotPasswordModal.tsx
│   │   ├── Header.tsx      # ⭐ Header réutilisable
│   │   ├── NotificationBadge.tsx
│   │   ├── ReviewModal.tsx
│   │   ├── StarRating.tsx
│   │   └── UserMenu.tsx
│   ├── lib/                 # Utilitaires
│   │   └── supabase.ts     # Client Supabase
│   └── types/               # Types TypeScript
├── tests/                   # Tests unitaires
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── tailwind.config.ts (implicite)
```

---

## 🧩 Composants réutilisables

### Header Component ⭐

Le composant `Header` est un composant réutilisable qui assure une navigation cohérente sur toutes les pages du site.

#### 📁 Emplacement
```
src/components/Header.tsx
```

#### 🎯 Avantages

✅ **Code réutilisable** : Le header est défini une seule fois  
✅ **Maintenance facile** : Une modification s'applique partout  
✅ **Cohérence** : Design identique sur toutes les pages  
✅ **Flexibilité** : Props pour personnaliser selon le contexte  

#### 📝 Code du composant

```tsx
import Link from 'next/link';
import { Palette, User as UserIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import UserMenu from '@/components/UserMenu';
import NotificationBadge from '@/components/NotificationBadge';

interface HeaderProps {
  user?: User | null;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  showAuthButtons?: boolean;
}

export default function Header({ 
  user, 
  onLoginClick, 
  onSignupClick, 
  showAuthButtons = true 
}: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center group-hover:from-slate-500 group-hover:to-slate-700 transition-all duration-300">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
              Hobby Academy
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NotificationBadge user={user} />
                <UserMenu user={user} />
              </>
            ) : showAuthButtons ? (
              <>
                <button 
                  onClick={onLoginClick}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                  Se connecter
                </button>
                <button 
                  onClick={onSignupClick}
                  className="flex items-center gap-2 bg-gradient-to-r from-slate-500 to-slate-700 text-white px-4 py-2 rounded-lg hover:from-slate-300 hover:to-slate-500 transition-all shadow-sm hover:shadow-md"
                >
                  <UserIcon className="w-4 h-4" />
                  S&apos;inscrire
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
```

#### 📚 Utilisation

##### Cas 1 : Page avec utilisateur connecté (Dashboard, profils, etc.)

```tsx
import Header from '@/components/Header';

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  // ... logique de récupération de l'utilisateur

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/50">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Contenu de la page */}
      </div>
    </div>
  );
}
```

##### Cas 2 : Page d'accueil avec boutons de connexion/inscription

```tsx
import Header from '@/components/Header';

export default function Home() {
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Header 
        user={user}
        onLoginClick={() => openAuthModal('login')}
        onSignupClick={() => openAuthModal('signup')}
        showAuthButtons={true}
      />
      
      {/* Reste de la page */}
    </div>
  );
}
```

##### Cas 3 : Page simple sans boutons d'authentification

```tsx
<Header 
  user={user}
  showAuthButtons={false}
/>
```

#### 🔧 Props du composant

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `user` | `User \| null \| undefined` | - | Objet utilisateur Supabase (de `getUser()`) |
| `onLoginClick` | `() => void` | - | Callback appelé lors du clic sur "Se connecter" |
| `onSignupClick` | `() => void` | - | Callback appelé lors du clic sur "S'inscrire" |
| `showAuthButtons` | `boolean` | `true` | Afficher ou masquer les boutons de connexion/inscription |

#### 📦 Dépendances

Le composant Header nécessite les composants suivants :
- **`UserMenu`** : Menu déroulant de l'utilisateur connecté (profil, paramètres, déconnexion)
- **`NotificationBadge`** : Badge de notifications avec compteur
- **`Lucide React`** : Pour les icônes (Palette, UserIcon)
- **`@supabase/supabase-js`** : Pour le type User

#### 🎨 Personnalisation

##### Changer le logo

Modifiez la section logo dans le composant :

```tsx
<div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg">
  <YourIcon className="w-5 h-5 text-white" />
</div>
```

##### Changer le nom de l'application

```tsx
<h1 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
  Votre Nom d'App  {/* Modifier ici */}
</h1>
```

##### Modifier le thème de couleur

Remplacez les classes Tailwind par vos couleurs :
```tsx
// Exemple : passer du thème slate à blue
from-slate-400 to-slate-600  →  from-blue-400 to-blue-600
border-slate-200/60          →  border-blue-200/60
text-slate-600               →  text-blue-600
```

#### 🚀 Migration des pages existantes

Pour migrer vos pages qui ont un header codé en dur :

**Avant** (100+ lignes dupliquées) :
```tsx
<header className="bg-white/95 backdrop-blur-sm shadow-sm ...">
  <div className="max-w-7xl mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      {/* ... 50+ lignes de JSX ... */}
    </div>
  </div>
</header>
```

**Après** (1 ligne) :
```tsx
<Header user={user} />
```

**Étapes** :
1. Supprimer tout le code du `<header>...</header>`
2. Importer le composant : `import Header from '@/components/Header';`
3. Remplacer par : `<Header user={user} />`
4. Ajouter les props nécessaires selon le contexte

#### ✅ Checklist d'implémentation

- [ ] Créer `src/components/Header.tsx`
- [ ] Vérifier que `UserMenu.tsx` existe
- [ ] Vérifier que `NotificationBadge.tsx` existe
- [ ] Remplacer le header dans `app/page.tsx` (accueil)
- [ ] Remplacer le header dans `app/dashboard/page.tsx`
- [ ] Remplacer le header dans `app/painter/[id]/page.tsx`
- [ ] Remplacer le header dans toutes les autres pages
- [ ] Tester l'affichage avec utilisateur connecté
- [ ] Tester l'affichage sans utilisateur
- [ ] Tester la responsivité mobile
- [ ] Vérifier le comportement des boutons

#### 🐛 Résolution de problèmes courants

**Problème** : Le header ne s'affiche pas  
**Solution** : Vérifier que le fichier est bien dans `src/components/` et que l'import est correct

**Problème** : Erreur TypeScript sur le type User  
**Solution** : Importer le type : `import type { User } from '@supabase/supabase-js';`

**Problème** : Les composants UserMenu ou NotificationBadge sont introuvables  
**Solution** : Créer ces composants ou ajuster les imports dans Header.tsx

**Problème** : Les boutons de connexion ne fonctionnent pas  
**Solution** : Vérifier que les callbacks sont bien passés en props :
```tsx
<Header 
  onLoginClick={() => openAuthModal('login')}
  onSignupClick={() => openAuthModal('signup')}
/>
```

---

## ✨ Fonctionnalités par module

### 🏠 Module : Page d'accueil
**Route** : `/`  
**Fichier** : `src/app/page.tsx`

**Fonctionnalités** :
- ✅ Liste de tous les formateurs approuvés
- ✅ Recherche globale (nom, ville, style)
- ✅ Filtres par niveau (Débutant, Intermédiaire, Avancé)
- ✅ Filtres par style (Warhammer, Fantasy, Sci-Fi, Historique, Anime)
- ✅ Affichage en grille responsive
- ✅ Cards formateurs avec :
  - Photo de profil
  - Nom et localisation
  - Notation moyenne + nombre d'avis
  - Styles enseignés (badges)
  - Niveaux acceptés
  - Disponibilités
  - Bouton "Contacter"
- ✅ Compteur de résultats
- ✅ État vide si aucun résultat
- ✅ Loading state avec animation

**Composants utilisés** :
- `Header` ⭐ (nouveau)
- `AuthModal`
- `UserMenu`
- `NotificationBadge`
- `AvailabilityDisplay`

---

### 🔐 Module : Authentification
**Routes** :
- `/auth/callback` - Callback OAuth
- `/reset-password` - Réinitialisation MDP

**Composants** :
- `Header` ⭐ - Navigation principale
- `AuthModal.tsx` - Connexion/Inscription
- `ForgotPasswordModal.tsx` - Récupération MDP

**Fonctionnalités** :
- ✅ Inscription avec email/mot de passe
- ✅ Connexion sécurisée
- ✅ OAuth (Google, GitHub, etc.)
- ✅ Réinitialisation de mot de passe par email
- ✅ Gestion de session avec Supabase Auth
- ✅ Protection des routes privées via middleware
- ✅ Redirection après connexion
- ✅ Messages d'erreur explicites

**Flow utilisateur** :
1. Clic sur "Se connecter" ou "S'inscrire" (dans Header)
2. Modale d'authentification s'ouvre
3. Saisie des informations
4. Validation et création de session
5. Redirection vers page d'origine ou dashboard

---

### 👤 Module : Profil & Paramètres
**Routes** :
- `/settings` - Paramètres du compte
- `/favorites` - Formateurs favoris
- `/notifications` - Centre de notifications

**Composants** :
- `Header` ⭐ - Navigation principale
- `UserMenu.tsx` - Menu dropdown utilisateur
- `NotificationBadge.tsx` - Badge notifications

**Fonctionnalités** :
- ✅ Modification des informations personnelles
- ✅ Changement de mot de passe
- ✅ Gestion de la photo de profil
- ✅ Préférences de notifications
- ✅ Liste des formateurs favoris
- ✅ Suppression de favoris
- ✅ Centre de notifications en temps réel
- ✅ Marquage des notifications comme lues
- ✅ Déconnexion

**Types de notifications** :
- 📨 Nouveau message reçu
- ⭐ Nouvel avis reçu (formateurs)
- ✅ Candidature validée (formateurs)
- ❤️ Ajout en favori (formateurs)

---

### 👨‍🎨 Module : Formateurs
**Routes** :
- `/become-painter` - Candidature formateur
- `/painter/[id]` - Profil public formateur
- `/painter/[id]/profile` - Vue détaillée
- `/dashboard` - Dashboard formateur

**Composants** :
- `Header` ⭐ - Navigation principale
- `AvailabilityDisplay.tsx`
- `StarRating.tsx`
- `ReviewModal.tsx`
- `FileUpload.tsx`

**Fonctionnalités - Candidature** :
- ✅ Formulaire de candidature complet
- ✅ Upload de photos de profil
- ✅ Sélection de styles enseignés
- ✅ Sélection de niveaux acceptés
- ✅ Définition des disponibilités
- ✅ Rédaction de la bio
- ✅ Indication de localisation
- ✅ Validation par admin requise

**Fonctionnalités - Profil public** :
- ✅ Page dédiée par formateur
- ✅ Affichage complet des informations
- ✅ Galerie de créations
- ✅ Liste des avis avec notes
- ✅ Calcul de la moyenne des notes
- ✅ Bouton "Contacter"
- ✅ Bouton "Ajouter aux favoris"

**Fonctionnalités - Dashboard** :
- ✅ Vue d'ensemble de l'activité
- ✅ Statistiques (vues profil, messages, avis)
- ✅ Gestion des disponibilités
- ✅ Modification du profil
- ✅ Gestion de la galerie
- ✅ Visualisation des avis reçus
- ✅ Accès rapide aux messages

---

### 💬 Module : Messagerie
**Routes** :
- `/messages` - Liste des conversations
- `/messages/[id]` - Conversation spécifique

**Composants** :
- `Header` ⭐ - Navigation principale

**Fonctionnalités** :
- ✅ Liste de toutes les conversations
- ✅ Création automatique de conversation au premier contact
- ✅ Messages en temps réel (Supabase real-time)
- ✅ Indicateur "non lu"
- ✅ Historique complet des messages
- ✅ Envoi de messages texte
- ✅ Horodatage des messages
- ✅ Statut de lecture
- ✅ Notification de nouveaux messages
- ✅ Interface responsive type chat

**Flow** :
1. Élève clique "Contacter" sur un formateur
2. Vérification si conversation existe
3. Si non, création de la conversation
4. Redirection vers `/messages/[conversation_id]`
5. Envoi de messages en temps réel

---

### 🖼️ Module : Galerie
**Route** : `/gallery`

**Composants** :
- `Header` ⭐ - Navigation principale
- `FileUpload.tsx`

**Fonctionnalités** :
- ✅ Galerie publique de toutes les créations
- ✅ Upload d'images par les formateurs
- ✅ Organisation par formateur
- ✅ Filtrage par style
- ✅ Recherche dans la galerie
- ✅ Vue en grille responsive
- ✅ Lightbox pour agrandir les images
- ✅ Informations sur chaque œuvre (auteur, style, date)
- ✅ Lien vers profil du formateur

---

### ⚙️ Module : Administration
**Route** : `/admin`

**Composants** :
- `Header` ⭐ - Navigation principale

**Fonctionnalités** :
- ✅ Validation des candidatures formateurs
- ✅ Approbation ou rejet avec message
- ✅ Modération des avis
- ✅ Suppression de contenus inappropriés
- ✅ Gestion des utilisateurs
- ✅ Bannissement d'utilisateurs
- ✅ Statistiques de la plateforme :
  - Nombre d'utilisateurs
  - Nombre de formateurs actifs
  - Nombre de messages échangés
  - Avis laissés
- ✅ Gestion des signalements
- ✅ Logs d'activité

**Accès** : Réservé au rôle admin uniquement

---

### 🔍 Module : Recherche & Filtres
**Composants** :
- `AdvancedFilters.tsx`

**Critères de recherche** :
- 🔤 Texte libre (nom, ville, styles)
- 📊 Niveau (Débutant, Intermédiaire, Avancé, Tous niveaux)
- 🎨 Style :
  - Warhammer
  - Fantasy
  - Sci-Fi
  - Historique
  - Anime
- 📍 Localisation (à venir)
- ⭐ Notation minimale (à venir)
- 📅 Disponibilités (à venir)

**Fonctionnalités** :
- ✅ Filtres combinables
- ✅ Mise à jour en temps réel des résultats
- ✅ Compteur de résultats
- ✅ Réinitialisation des filtres
- ✅ Sauvegarde des préférences (localStorage)

---

### ⭐ Module : Avis & Notation
**Composants** :
- `StarRating.tsx` - Affichage et saisie d'étoiles
- `ReviewModal.tsx` - Formulaire d'avis

**Fonctionnalités** :
- ✅ Notation de 1 à 5 étoiles
- ✅ Commentaire textuel
- ✅ Validation avant publication
- ✅ Un avis par élève par formateur
- ✅ Modification d'avis existant
- ✅ Calcul automatique de la moyenne
- ✅ Affichage du nombre total d'avis
- ✅ Tri des avis (récents, meilleurs)
- ✅ Réponse possible du formateur (à venir)

---

## 🗄️ Base de données

### Schéma Supabase

#### Table : `users`
Extension du système auth de Supabase
```sql
- id (uuid, PK)
- email (text)
- role (enum: 'student', 'painter', 'admin')
- created_at (timestamp)
```

#### Table : `painters`
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- name (text)
- bio (text)
- location (text)
- profile_image_url (text)
- availability (text) -- Format JSON ou texte structuré
- status (enum: 'pending', 'approved', 'rejected')
- created_at (timestamp)
- updated_at (timestamp)
```

#### Table : `painter_styles`
```sql
- id (uuid, PK)
- painter_id (uuid, FK → painters.id)
- style (text) -- Warhammer, Fantasy, Sci-Fi, etc.
```

#### Table : `painter_levels`
```sql
- id (uuid, PK)
- painter_id (uuid, FK → painters.id)
- level (text) -- Débutant, Intermédiaire, Avancé
```

#### Table : `painter_ratings`
```sql
- id (uuid, PK)
- painter_id (uuid, FK → painters.id)
- average_rating (numeric)
- review_count (integer)
- updated_at (timestamp)
```

#### Table : `reviews`
```sql
- id (uuid, PK)
- painter_id (uuid, FK → painters.id)
- student_id (uuid, FK → users.id)
- rating (integer, 1-5)
- comment (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Table : `conversations`
```sql
- id (uuid, PK)
- painter_id (uuid, FK → painters.id)
- student_id (uuid, FK → users.id)
- created_at (timestamp)
- last_message_at (timestamp)
```

#### Table : `messages`
```sql
- id (uuid, PK)
- conversation_id (uuid, FK → conversations.id)
- sender_id (uuid, FK → users.id)
- content (text)
- read (boolean)
- created_at (timestamp)
```

#### Table : `notifications`
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- type (text) -- 'message', 'review', 'approval', etc.
- content (text)
- link (text) -- URL de redirection
- read (boolean)
- created_at (timestamp)
```

#### Table : `favorites`
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- painter_id (uuid, FK → painters.id)
- created_at (timestamp)
```

#### Table : `gallery_items`
```sql
- id (uuid, PK)
- painter_id (uuid, FK → painters.id)
- image_url (text)
- title (text)
- description (text)
- style (text)
- created_at (timestamp)
```

#### Table : `profile_views` (pour le dashboard formateur)
```sql
- id (uuid, PK)
- painter_id (uuid, FK → painters.id)
- viewer_id (uuid, FK → users.id, nullable)
- viewed_at (timestamp)
```

### Policies RLS (Row Level Security)

Exemples de policies Supabase :
```sql
-- Painters : lecture publique, modification par owner
CREATE POLICY "Painters are viewable by everyone"
ON painters FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can update own painter profile"
ON painters FOR UPDATE
USING (auth.uid() = user_id);

-- Messages : lecture uniquement pour participants
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (
  auth.uid() IN (
    SELECT sender_id FROM conversations WHERE id = conversation_id
    UNION
    SELECT painter_id FROM conversations WHERE id = conversation_id
    UNION
    SELECT student_id FROM conversations WHERE id = conversation_id
  )
);

-- Reviews : lecture publique, création par élèves uniquement
CREATE POLICY "Reviews are viewable by everyone"
ON reviews FOR SELECT
USING (true);

CREATE POLICY "Students can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Favorites : accès limité au propriétaire
CREATE POLICY "Users can manage own favorites"
ON favorites FOR ALL
USING (auth.uid() = user_id);
```

---

## 🎨 Design System

### Palette de couleurs

**Thème principal : Slate (nuances de gris)**
```
Primaire :
- slate-50  : #f8fafc (backgrounds clairs)
- slate-100 : #f1f5f9 (backgrounds)
- slate-200 : #e2e8f0 (borders)
- slate-300 : #cbd5e1 (borders hover)
- slate-400 : #94a3b8 (icônes, texte secondaire)
- slate-500 : #64748b (boutons, liens)
- slate-600 : #475569 (texte principal)
- slate-700 : #334155 (titres)
- slate-800 : #1e293b (texte important)
- slate-900 : #0f172a (très foncé)

Accents :
- blue-500  : #3b82f6 (notifications, actions)
- green-500 : #22c55e (succès)
- red-500   : #ef4444 (erreurs, favoris)
- yellow-500: #eab308 (étoiles, avertissements)
- purple-500: #a855f7 (messagerie)
```

### Composants de design

**Cartes** :
```css
bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition
border border-slate-200/60 hover:border-slate-300
```

**Boutons primaires** :
```css
bg-gradient-to-r from-slate-500 to-slate-700 text-white 
px-4 py-2 rounded-lg hover:from-slate-300 hover:to-slate-500 
transition-all shadow-sm hover:shadow-md
```

**Boutons secondaires** :
```css
text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg 
hover:bg-slate-100 transition-all
```

**Badges** :
```css
px-3 py-1 bg-slate-100 text-slate-600 rounded-full 
text-xs font-medium
```

### Typography

```css
Titres H1 : text-4xl font-bold text-slate-800
Titres H2 : text-3xl font-bold text-slate-800
Titres H3 : text-2xl font-bold text-slate-800
Titres H4 : text-xl font-bold text-slate-800
Corps : text-base text-slate-600
Petit : text-sm text-slate-500
Très petit : text-xs text-slate-400
```

### Responsivité

**Breakpoints Tailwind** :
- `sm` : 640px
- `md` : 768px
- `lg` : 1024px
- `xl` : 1280px
- `2xl` : 1536px

**Grilles responsive** :
```css
grid md:grid-cols-2 lg:grid-cols-3 gap-6
```

---

## 🔐 Authentification

### Flow d'authentification

1. **Inscription** :
   - Email + mot de passe
   - Envoi d'un email de confirmation
   - Redirection vers page de confirmation

2. **Connexion** :
   - Email + mot de passe
   - Vérification des credentials
   - Création de session JWT
   - Redirection vers dashboard ou page précédente

3. **OAuth** :
   - Clic sur bouton OAuth (Google, GitHub, etc.)
   - Redirection vers provider
   - Callback vers `/auth/callback`
   - Création/mise à jour du profil
   - Redirection

4. **Mot de passe oublié** :
   - Saisie de l'email
   - Envoi d'un email avec lien unique
   - Redirection vers `/reset-password?token=...`
   - Saisie nouveau mot de passe
   - Confirmation et connexion automatique

### Protection des routes

**Middleware Next.js** (`middleware.ts`) :
```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Routes protégées
  const protectedRoutes = ['/dashboard', '/settings', '/messages'];
  const adminRoutes = ['/admin'];
  
  // Vérifier session
  const session = await getSession();
  
  if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    const user = await getUser();
    if (user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### Sessions

- **Durée** : 7 jours par défaut
- **Refresh** : Automatique si token valide
- **Storage** : Cookie httpOnly + localStorage (pour état client)

---

## 🧭 Routes et navigation

### Routes publiques
```
/                           # Page d'accueil (liste formateurs)
/painter/[id]              # Profil public formateur
/painter/[id]/profile      # Vue détaillée formateur
/gallery                   # Galerie publique
/auth/callback             # Callback OAuth
/reset-password            # Réinitialisation MDP
```

### Routes protégées (authentification requise)
```
/dashboard                 # Dashboard utilisateur
/messages                  # Liste conversations
/messages/[id]             # Conversation spécifique
/favorites                 # Formateurs favoris
/settings                  # Paramètres compte
/notifications             # Centre notifications
/become-painter            # Candidature formateur
/painter/[id]/reviews      # Avis (si formateur)
```

### Routes admin
```
/admin                     # Panel administration
/admin/painters            # Validation formateurs
/admin/users               # Gestion utilisateurs
/admin/reports             # Signalements
```

### Navigation dans le Header

Le composant `Header` est présent sur toutes les pages et permet :
- **Logo** : Retour à la page d'accueil (/)
- **Notifications** : Accès au centre de notifications (/notifications)
- **Menu utilisateur** :
  - Dashboard (/dashboard)
  - Messages (/messages)
  - Favoris (/favorites)
  - Paramètres (/settings)
  - Déconnexion

---

## 📝 Notes de développement

### Bonnes pratiques

1. **Composants** :
   - Toujours utiliser le composant `Header` au lieu de coder un header en dur
   - Privilégier les Server Components quand possible
   - Client Components uniquement pour interactivité

2. **State management** :
   - `useState` pour état local
   - Supabase real-time pour synchronisation
   - Pas de Redux nécessaire

3. **Styling** :
   - Respecter la palette slate
   - Utiliser les classes Tailwind utilitaires
   - Pas de CSS custom sauf nécessaire

4. **Performance** :
   - Next/Image pour toutes les images
   - Lazy loading des composants lourds
   - Pagination des listes longues

5. **Sécurité** :
   - Toujours valider côté serveur
   - Row Level Security (RLS) activée sur toutes les tables
   - Inputs sanitizés

### Scripts disponibles

```bash
npm run dev          # Développement (localhost:3000)
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # Linter ESLint
npm run test         # Tests unitaires
npm run test:e2e     # Tests E2E Playwright
```

---

## 🚀 Déploiement

### Vercel (recommandé)

1. Connecter le repository GitHub
2. Configurer les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Déployer automatiquement à chaque push sur `main`

### Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxx

# Optionnel
NEXT_PUBLIC_SITE_URL=https://hobby-academy.vercel.app
```

---

## 📞 Support et contribution

Pour toute question ou contribution :
1. Ouvrir une issue sur GitHub
2. Proposer une Pull Request
3. Contacter l'équipe de développement

---

**Dernière mise à jour** : Octobre 2024  
**Version** : 1.0.0