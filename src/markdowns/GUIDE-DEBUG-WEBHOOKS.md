# 🐛 Guide de débogage - Webhooks Stripe dupliqués

## 🔍 Problème identifié

Les webhooks Stripe `checkout.session.completed` étaient traités plusieurs fois, causant la réactivation répétée des abonnements utilisateur.

## 🚨 Symptômes

- Logs répétés : "Paiement réussi pour: { sessionId: '...', planType: '...', userEmail: '...' }"
- Plan utilisateur réinitialisé à chaque rechargement de page
- Compteurs QR codes remis à zéro de façon inattendue

## 🔧 Solution implémentée

### 1. Protection globale contre les doublons

```typescript
// Dans src/pages/api/webhooks/stripe.ts
const { data: existingEvent } = await supabase
  .from("payment_events")
  .select("id")
  .eq("stripe_event_id", event.id)
  .single();

if (existingEvent) {
  console.log(`⚠️ Événement ${event.id} déjà traité, ignoré`);
  return new Response("Event already processed", { status: 200 });
}
```

### 2. Index unique sur les événements

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_unique
ON payment_events(stripe_event_id);
```

## 🧹 Nettoyage des données

Exécuter le script `cleanup-duplicate-events.sql` pour :

1. Identifier les événements dupliqués
2. Supprimer les doublons (garder le plus récent)
3. Ajouter l'index unique
4. Vérifier le résultat

## 📊 Monitoring

### Vérifier les événements dupliqués

```sql
SELECT
  stripe_event_id,
  event_type,
  COUNT(*) as count
FROM payment_events
GROUP BY stripe_event_id, event_type
HAVING COUNT(*) > 1;
```

### Voir les derniers événements

```sql
SELECT
  stripe_event_id,
  event_type,
  processed_at,
  data->>'plan_type' as plan_type
FROM payment_events
ORDER BY processed_at DESC
LIMIT 10;
```

## 🛡️ Prévention

1. **Idempotence** : Chaque webhook est maintenant idempotent
2. **Logging amélioré** : Chaque événement est loggé avec son ID unique
3. **Contrainte DB** : Index unique empêche les doublons au niveau base de données

## 🔄 Pourquoi Stripe envoie des doublons ?

- **Tentatives de livraison** : Stripe réessaie si pas de réponse 200
- **Timeouts** : Si votre endpoint met trop de temps à répondre
- **Erreurs réseau** : Connexions interrompues
- **Redémarrages serveur** : Pendant les déploiements

## ✅ Vérification post-fix

1. Tester un nouveau paiement
2. Vérifier qu'un seul événement est créé dans `payment_events`
3. Confirmer que le plan utilisateur n'est activé qu'une fois
4. Recharger la page plusieurs fois pour confirmer la stabilité

---

**Note** : Ce fix garantit que chaque événement Stripe n'est traité qu'une seule fois, même si Stripe l'envoie plusieurs fois.
