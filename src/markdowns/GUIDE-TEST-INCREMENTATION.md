# 🧪 Guide de Test - Incrémentation QR Codes

## 📋 Fonctionnalités ajoutées

### ✅ **API d'incrémentation**

- **Endpoint** : `/api/increment-qr-usage`
- **Méthode** : POST
- **Fonction** : Incrémente `qr_codes_used_this_month` à chaque génération de QR code

### ✅ **Mise à jour automatique de l'interface**

- Compteur en temps réel dans le header
- Notification automatique quand la limite est atteinte
- Désactivation du formulaire après limite atteinte

### ✅ **Fonctions SQL utilitaires**

- `check_user_qr_status()` : Vérifier l'état d'un utilisateur
- Tests automatisés pour valider le comportement

## 🚀 **Comment tester**

### **Étape 1 : Vérifier l'état initial**

```sql
-- Dans Supabase SQL Editor
SELECT * FROM check_user_qr_status('18ee5d63-fd9a-4c15-9001-20e6000039b6');
```

### **Étape 2 : Générer un QR code**

1. Allez sur votre dashboard
2. Remplissez le formulaire (IBAN, montant, etc.)
3. Cliquez sur "Générer le QR Code"
4. **Observez** :
   - Le QR code se génère
   - Le compteur dans le header se met à jour automatiquement
   - Les logs dans la console du navigateur

### **Étape 3 : Vérifier l'incrémentation en base**

```sql
-- Vérifier que le compteur a bien été incrémenté
SELECT * FROM check_user_qr_status('18ee5d63-fd9a-4c15-9001-20e6000039b6');
```

### **Étape 4 : Tester la limite (plan one_time)**

Puisque vous avez un plan `one_time` avec limite de 1 QR code :

1. **Premier QR code** : Devrait fonctionner normalement
2. **Deuxième tentative** :
   - Une notification rouge devrait apparaître en haut à droite
   - Le bouton "Générer" devrait se désactiver
   - Le texte devrait changer pour "Limite atteinte 🚫"

## 🔍 **Logs à surveiller**

### **Console navigateur** :

```
Incrémentation usage QR pour: 18ee5d63-fd9a-4c15-9001-20e6000039b6
Compteur mis à jour: {qr_codes_used_this_month: 1, qr_codes_limit: 1, ...}
```

### **Console serveur** (terminal) :

```
Incrémentation usage QR pour utilisateur: 18ee5d63-fd9a-4c15-9001-20e6000039b6
Compteur mis à jour: {...}
```

## 🛠️ **Dépannage**

### **Si l'incrémentation ne fonctionne pas** :

1. **Vérifier l'API** :

```bash
curl -X POST http://localhost:4321/api/increment-qr-usage \
  -H "Content-Type: application/json" \
  -d '{"userId":"18ee5d63-fd9a-4c15-9001-20e6000039b6"}'
```

2. **Vérifier les permissions Supabase** :

```sql
-- Vérifier que l'utilisateur existe
SELECT * FROM public.users WHERE id = '18ee5d63-fd9a-4c15-9001-20e6000039b6';

-- Tester l'incrémentation manuelle
UPDATE public.users
SET qr_codes_used_this_month = qr_codes_used_this_month + 1
WHERE id = '18ee5d63-fd9a-4c15-9001-20e6000039b6';
```

3. **Vérifier les logs d'erreur** :
   - Console navigateur (F12)
   - Terminal du serveur Astro
   - Logs Supabase

### **Si l'interface ne se met pas à jour** :

1. Vérifier que l'attribut `data-usage-display` est présent dans le header
2. Vérifier que la fonction `updateLocalUsageDisplay()` est appelée
3. Rafraîchir la page pour voir les changements

## 📊 **Comportement attendu par plan**

### **Plan `one_time` (votre cas actuel)** :

- ✅ Limite : 1 QR code
- ✅ Après 1 génération : Formulaire désactivé
- ✅ Message : "Vous avez utilisé votre QR code unique !"

### **Plan `premium`** :

- ✅ Limite : Illimitée (-1)
- ✅ Compteur s'incrémente mais pas de blocage
- ✅ Affichage : "X/∞ QR"

## 🎯 **Test complet recommandé**

1. **État initial** : `0/1 QR` dans le header
2. **Première génération** :
   - QR code créé ✅
   - Compteur : `1/1 QR` ✅
   - Notification limite atteinte ✅
   - Bouton désactivé ✅
3. **Tentative suivante** : Formulaire bloqué ✅

## 🔄 **Reset pour nouveaux tests**

Si vous voulez tester à nouveau :

```sql
-- Remettre le compteur à 0
UPDATE public.users
SET qr_codes_used_this_month = 0
WHERE id = '18ee5d63-fd9a-4c15-9001-20e6000039b6';
```

Puis rafraîchissez la page pour voir `0/1 QR` dans le header.

---

**🎉 Résultat attendu** : Système complet qui incrémente automatiquement l'usage et bloque l'utilisateur quand sa limite est atteinte, avec mise à jour en temps réel de l'interface !
