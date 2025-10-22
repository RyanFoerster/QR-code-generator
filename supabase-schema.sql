-- =============================================
-- SCRIPT DE CRÉATION DE LA BASE DE DONNÉES
-- QR Code Generator - Supabase Schema
-- =============================================

-- Extension nécessaire pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. TABLE PRINCIPALE DES UTILISATEURS
-- =============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'inactive')),
    subscription_stripe_id VARCHAR(255),
    subscription_current_period_start TIMESTAMP WITH TIME ZONE,
    subscription_current_period_end TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255),
    qr_codes_used_this_month INTEGER DEFAULT 0,
    last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. TABLE DES CRÉDITS QR
-- =============================================

CREATE TABLE IF NOT EXISTS qr_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credits_purchased INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    stripe_payment_intent_id VARCHAR(255),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. TABLE DES ABONNEMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    tier VARCHAR(20) DEFAULT 'premium' CHECK (tier = 'premium'),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. TABLE DES CODES QR
-- =============================================

CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    style JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. VUE DES STATISTIQUES UTILISATEUR
-- =============================================

CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.subscription_status,
    u.subscription_current_period_end,
    u.qr_codes_used_this_month,
    COALESCE(SUM(qc.credits_purchased), 0) as total_credits_purchased,
    COALESCE(SUM(qc.credits_used), 0) as total_credits_used,
    COALESCE(SUM(qc.credits_purchased) - SUM(qc.credits_used), 0) as available_credits,
    CASE 
        WHEN u.subscription_status = 'active' THEN 'premium'
        WHEN COALESCE(SUM(qc.credits_purchased) - SUM(qc.credits_used), 0) > 0 THEN 'credits'
        ELSE 'none'
    END as current_plan_type
FROM users u
LEFT JOIN qr_credits qc ON u.id = qc.user_id
GROUP BY u.id, u.email, u.created_at, u.subscription_status, 
         u.subscription_current_period_end, u.qr_codes_used_this_month;

-- =============================================
-- 6. FONCTIONS RPC
-- =============================================

-- Fonction pour vérifier si un utilisateur peut créer un QR code
CREATE OR REPLACE FUNCTION can_create_qr_code(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_subscription_status VARCHAR(20);
    user_available_credits INTEGER;
    user_qr_usage INTEGER;
    current_month_start DATE;
BEGIN
    -- Récupérer les informations de l'utilisateur
    SELECT subscription_status, qr_codes_used_this_month 
    INTO user_subscription_status, user_qr_usage
    FROM users 
    WHERE id = user_uuid;
    
    -- Si l'utilisateur n'existe pas
    IF user_subscription_status IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Si l'utilisateur a un abonnement actif, il peut créer des QR codes
    IF user_subscription_status = 'active' THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier les crédits disponibles
    SELECT available_credits INTO user_available_credits
    FROM user_stats 
    WHERE id = user_uuid;
    
    -- Si l'utilisateur a des crédits disponibles
    IF COALESCE(user_available_credits, 0) > 0 THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour consommer un crédit QR
CREATE OR REPLACE FUNCTION consume_qr_credit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_subscription_status VARCHAR(20);
    user_available_credits INTEGER;
    credit_record_id UUID;
BEGIN
    -- Récupérer le statut de l'utilisateur
    SELECT subscription_status INTO user_subscription_status
    FROM users 
    WHERE id = user_uuid;
    
    -- Si l'utilisateur a un abonnement actif, pas besoin de consommer de crédit
    IF user_subscription_status = 'active' THEN
        RETURN TRUE;
    END IF;
    
    -- Vérifier les crédits disponibles
    SELECT available_credits INTO user_available_credits
    FROM user_stats 
    WHERE id = user_uuid;
    
    -- Si pas de crédits disponibles
    IF COALESCE(user_available_credits, 0) <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Trouver un enregistrement de crédit avec des crédits disponibles
    SELECT id INTO credit_record_id
    FROM qr_credits 
    WHERE user_id = user_uuid 
    AND (credits_purchased - credits_used) > 0
    ORDER BY purchased_at ASC
    LIMIT 1;
    
    -- Si aucun crédit trouvé
    IF credit_record_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Consommer un crédit
    UPDATE qr_credits 
    SET credits_used = credits_used + 1
    WHERE id = credit_record_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les crédits disponibles
CREATE OR REPLACE FUNCTION get_available_qr_credits(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    user_subscription_status VARCHAR(20);
    user_available_credits INTEGER;
BEGIN
    -- Récupérer le statut de l'utilisateur
    SELECT subscription_status INTO user_subscription_status
    FROM users 
    WHERE id = user_uuid;
    
    -- Si l'utilisateur a un abonnement actif, retourner -1 (illimité)
    IF user_subscription_status = 'active' THEN
        RETURN -1;
    END IF;
    
    -- Récupérer les crédits disponibles
    SELECT available_credits INTO user_available_credits
    FROM user_stats 
    WHERE id = user_uuid;
    
    RETURN COALESCE(user_available_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. TRIGGERS
-- =============================================

-- Trigger pour mettre à jour updated_at sur qr_codes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qr_codes_updated_at
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. POLITIQUES DE SÉCURITÉ RLS
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table users
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Politiques pour la table qr_credits
CREATE POLICY "Users can view own credits" ON qr_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON qr_credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour la table subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour la table qr_codes
CREATE POLICY "Users can view own qr codes" ON qr_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own qr codes" ON qr_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own qr codes" ON qr_codes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own qr codes" ON qr_codes
    FOR DELETE USING (auth.uid() = user_id);

-- Politique spéciale pour permettre la lecture publique des QR codes partagés
CREATE POLICY "Public can view shared qr codes" ON qr_codes
    FOR SELECT USING (true);

-- =============================================
-- 9. INDEX POUR LES PERFORMANCES
-- =============================================

-- Index sur les clés étrangères
CREATE INDEX IF NOT EXISTS idx_qr_credits_user_id ON qr_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);

-- Index sur les champs de recherche fréquents
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_qr_credits_payment_intent ON qr_credits(stripe_payment_intent_id);

-- Index sur les dates pour les requêtes temporelles
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON qr_codes(created_at);
CREATE INDEX IF NOT EXISTS idx_qr_credits_purchased_at ON qr_credits(purchased_at);

-- =============================================
-- 10. DONNÉES DE TEST (OPTIONNEL)
-- =============================================

-- Décommentez ces lignes si vous voulez des données de test
/*
INSERT INTO users (id, email, subscription_status) VALUES 
('00000000-0000-0000-0000-000000000001', 'test@example.com', 'inactive');

INSERT INTO qr_credits (user_id, credits_purchased, credits_used) VALUES 
('00000000-0000-0000-0000-000000000001', 10, 0);
*/

-- =============================================
-- FIN DU SCRIPT
-- =============================================
