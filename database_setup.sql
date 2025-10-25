-- =============================================
-- MARKETPLACE DE SERVICIOS - SETUP DE BASE DE DATOS
-- =============================================
-- Este archivo contiene todos los scripts SQL necesarios para configurar
-- la base de datos del marketplace de servicios en Supabase.

-- =============================================
-- 1. CREACIÓN DE TABLAS
-- =============================================

-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    user_type TEXT CHECK (user_type IN ('cliente', 'proveedor')) DEFAULT 'cliente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_proveedor UUID REFERENCES profiles(id) NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    ubicacion TEXT,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de reservas
CREATE TABLE IF NOT EXISTS reservas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_cliente UUID REFERENCES profiles(id) NOT NULL,
    id_servicio UUID REFERENCES servicios(id) NOT NULL,
    fecha DATE NOT NULL,
    estado TEXT CHECK (estado IN ('pendiente', 'confirmada', 'en proceso', 'completada', 'cancelada')) DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. FUNCIÓN PARA UPDATED_AT AUTOMÁTICO
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 3. TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at BEFORE UPDATE ON servicios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at BEFORE UPDATE ON reservas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. FUNCIÓN DE VALIDACIÓN PARA RESERVAS ACTIVAS
-- =============================================

CREATE OR REPLACE FUNCTION validate_active_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar si ya existe una reserva activa para el mismo cliente y servicio
    IF EXISTS (
        SELECT 1 FROM reservas
        WHERE id_cliente = NEW.id_cliente
          AND id_servicio = NEW.id_servicio
          AND estado IN ('pendiente', 'confirmada', 'en proceso')
    ) THEN
        RAISE EXCEPTION 'No se puede crear una nueva reserva para este servicio porque ya existe una reserva activa (pendiente, confirmada o en proceso).';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar antes de insertar
CREATE TRIGGER validate_reservas_active_booking
    BEFORE INSERT ON reservas
    FOR EACH ROW
    EXECUTE FUNCTION validate_active_booking();

-- =============================================
-- 5. FUNCIÓN DE VALIDACIÓN DE TRANSICIONES DE ESTADOS
-- =============================================

CREATE OR REPLACE FUNCTION validate_booking_state_transition()
RETURNS TRIGGER AS $$
DECLARE
    valid_transitions JSONB := '{
        "pendiente": ["confirmada", "cancelada"],
        "confirmada": ["en proceso", "completada", "cancelada"],
        "en proceso": ["completada", "cancelada"],
        "completada": [],
        "cancelada": []
    }';
    current_valid_states TEXT[];
    new_state TEXT := NEW.estado;
    old_state TEXT := OLD.estado;
BEGIN
    -- Si el estado no cambia, permitir la actualización
    IF old_state = new_state THEN
        RETURN NEW;
    END IF;

    -- Obtener los estados válidos para el estado actual
    current_valid_states := ARRAY(SELECT jsonb_array_elements_text(valid_transitions->old_state));

    -- Verificar si la nueva transición es válida
    IF new_state IS NULL OR NOT (new_state = ANY(current_valid_states)) THEN
        RAISE EXCEPTION 'Transición de estado inválida: de "%" a "%". Estados válidos: %',
                        old_state, new_state, array_to_string(current_valid_states, ', ');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar transiciones antes de actualizar
CREATE TRIGGER validate_reservas_state_transition
    BEFORE UPDATE ON reservas
    FOR EACH ROW
    WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
    EXECUTE FUNCTION validate_booking_state_transition();

-- =============================================
-- 6. POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para servicios
CREATE POLICY "Anyone can view services" ON servicios
    FOR SELECT USING (true);

CREATE POLICY "Providers can insert own services" ON servicios
    FOR INSERT WITH CHECK (auth.uid() = id_proveedor);

CREATE POLICY "Providers can update own services" ON servicios
    FOR UPDATE USING (auth.uid() = id_proveedor);

CREATE POLICY "Providers can delete own services" ON servicios
    FOR DELETE USING (auth.uid() = id_proveedor);

-- Políticas para reservas
CREATE POLICY "Users can view own bookings" ON reservas
    FOR SELECT USING (
        auth.uid() = id_cliente OR
        auth.uid() IN (
            SELECT s.id_proveedor FROM servicios s WHERE s.id = reservas.id_servicio
        )
    );

CREATE POLICY "Clients can create bookings" ON reservas
    FOR INSERT WITH CHECK (auth.uid() = id_cliente);

CREATE POLICY "Clients can update own bookings" ON reservas
    FOR UPDATE USING (auth.uid() = id_cliente);

CREATE POLICY "Clients can delete own bookings" ON reservas
    FOR DELETE USING (auth.uid() = id_cliente);

-- =============================================
-- 7. FUNCIONES ÚTILES
-- =============================================

-- Función para obtener servicios de un proveedor
CREATE OR REPLACE FUNCTION get_provider_services(provider_id UUID)
RETURNS TABLE (
    id UUID,
    titulo TEXT,
    descripcion TEXT,
    categoria TEXT,
    precio DECIMAL,
    ubicacion TEXT,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.titulo, s.descripcion, s.categoria, s.precio,
           s.ubicacion, s.imagen_url, s.created_at
    FROM servicios s
    WHERE s.id_proveedor = provider_id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener reservas de un cliente
CREATE OR REPLACE FUNCTION get_client_bookings(client_id UUID)
RETURNS TABLE (
    id UUID,
    servicio_titulo TEXT,
    servicio_categoria TEXT,
    fecha DATE,
    estado TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, s.titulo, s.categoria, r.fecha, r.estado, r.created_at
    FROM reservas r
    JOIN servicios s ON r.id_servicio = s.id
    WHERE r.id_cliente = client_id
    ORDER BY r.fecha DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- 8. ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- =============================================

CREATE INDEX IF NOT EXISTS idx_servicios_proveedor ON servicios(id_proveedor);
CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON servicios(categoria);
CREATE INDEX IF NOT EXISTS idx_reservas_cliente ON reservas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_reservas_servicio ON reservas(id_servicio);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha);

-- =============================================
-- 9. VERIFICACIÓN DE LA INSTALACIÓN
-- =============================================

-- Consulta para verificar que todo se creó correctamente
SELECT
    'profiles' as tabla,
    COUNT(*) as registros
FROM profiles
UNION ALL
SELECT
    'servicios' as tabla,
    COUNT(*) as registros
FROM servicios
UNION ALL
SELECT
    'reservas' as tabla,
    COUNT(*) as registros
FROM reservas;

-- =============================================
-- FIN DEL SETUP
-- =============================================
-- La base de datos está lista para usar con el marketplace de servicios.
-- Puedes ejecutar este archivo completo en Supabase SQL Editor.