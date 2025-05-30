# 🔧 Configuration des URLs de redirection

## 1. Variables d'environnement (.env)

```env
# Supabase Configuration
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration - ⚠️ IMPORTANT : Changez selon votre port
PUBLIC_APP_URL=http://localhost:4321
```

## 2. Configuration Supabase Dashboard

### Authentication → URL Configuration :

**Site URL :**

```
http://localhost:4321
```

**Redirect URLs (ajoutez ces URLs) :**

```
http://localhost:4321/api/auth/callback
http://localhost:4321/auth/signin
http://localhost:4321/dashboard
```

## 3. Configuration OAuth (si utilisé)

### Pour Google OAuth :

- **Authorized JavaScript origins :** `http://localhost:4321`
- **Authorized redirect URIs :** `https://votre-projet.supabase.co/auth/v1/callback`

### Pour GitHub OAuth :

- **Homepage URL :** `http://localhost:4321`
- **Authorization callback URL :** `https://votre-projet.supabase.co/auth/v1/callback`

## 4. Email Templates (optionnel)

Dans Supabase Dashboard → Authentication → Email Templates :

### Confirm signup template :

```html
<h2>Confirmez votre inscription</h2>
<p>Cliquez sur le lien ci-dessous pour confirmer votre compte :</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup"
    >Confirmer mon compte</a
  >
</p>
```

## 5. Pour la production

Quand vous déployez, changez :

```env
PUBLIC_APP_URL=https://votre-domaine.com
```

Et dans Supabase :

- **Site URL :** `https://votre-domaine.com`
- **Redirect URLs :** `https://votre-domaine.com/api/auth/callback`
