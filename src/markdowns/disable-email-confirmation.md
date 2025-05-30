# 🔧 Désactiver la confirmation email (pour les tests)

## Dans Supabase Dashboard :

1. **Allez dans** : Authentication → Settings
2. **Trouvez** : "Email confirmation"
3. **Décochez** : "Enable email confirmations"
4. **Sauvegardez**

## ⚠️ Important :

- Ceci est pour les **tests uniquement**
- En production, **gardez la confirmation activée** pour la sécurité
- Les nouveaux utilisateurs seront automatiquement confirmés

## Alternative : Confirmer manuellement dans la DB

```sql
-- Dans Supabase SQL Editor, confirmer un utilisateur manuellement :
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'ryanfoerster@outlook.be';
```
