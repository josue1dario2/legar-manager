-- ============================================
-- LEGAL MANAGER SAAS - DATABASE SCHEMA
-- Ejecutar en Supabase SQL Editor
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'cliente')),
    empresa TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    expediente TEXT NOT NULL,
    nSiniestro TEXT,
    actor TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'Conciliación Obligatoria' CHECK (tipo IN ('Conciliación Obligatoria', 'Demanda', 'Defensa del Consumidor', 'Oficio')),
    fechaDerivacion DATE,
    fechaRecepcion DATE DEFAULT CURRENT_DATE,
    vencimiento DATE,
    juzgado TEXT,
    prioridad TEXT DEFAULT 'Media' CHECK (prioridad IN ('Alta', 'Media', 'Baja')),
    oblea TEXT,
    fechaDespacho DATE,
    estado TEXT DEFAULT 'PENDIENTE',
    alertas_activas BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    registro_id UUID REFERENCES registros(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('vencimiento', 'nuevo_registro', 'estado_cambiado')),
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registros_user_id ON registros(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_vencimiento ON registros(vencimiento) WHERE alertas_activas = TRUE;
CREATE INDEX IF NOT EXISTS idx_registros_estado ON registros(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_user_id ON alertas(user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_leida ON alertas(leida) WHERE leida = FALSE;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "registros_select_own" ON registros FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "registros_insert_own" ON registros FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "registros_update_own" ON registros FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "registros_delete_own" ON registros FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "registros_select_admin" ON registros FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "alertas_select_own" ON alertas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "alertas_update_own" ON alertas FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "alertas_insert_own" ON alertas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "alertas_delete_own" ON alertas FOR DELETE USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, empresa)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'cliente',
        COALESCE(NEW.raw_user_meta_data->>'empresa', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();