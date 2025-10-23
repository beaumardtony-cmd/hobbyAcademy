# 📚 Documentation Complète - Hobby Academy

## 📖 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Structure du projet](#structure-du-projet)
4. [Fonctionnalités par module](#fonctionnalités-par-module)
5. [Base de données](#base-de-données)
6. [Design System](#design-system)
7. [Authentification](#authentification)
8. [Routes et navigation](#routes-et-navigation)

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
1. Clic sur "Se connecter" ou "S'inscrire"
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
