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
    otp_secret TEXT,
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
-- 8. ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- =============================================

-- Inserción de datos de ejemplo en la tabla servicios
INSERT INTO servicios (id_proveedor, titulo, descripcion, categoria, precio, ubicacion, imagen_url)
VALUES
-- Limpieza
(gen_random_uuid(), 'Limpieza de casas', 'Servicio completo de limpieza para hogares y apartamentos.', 'Limpieza', 25.00, 'San Salvador', 'https://plus.unsplash.com/premium_photo-1663011218145-c1d0c3ba3542?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Plomería
(gen_random_uuid(), 'Reparaciones de plomería', 'Instalación y reparación de tuberías, grifos y drenajes.', 'Plomería', 35.00, 'Santa Tecla', 'https://images.unsplash.com/photo-1676210134188-4c05dd172f89?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1974'),
-- Electricidad
(gen_random_uuid(), 'Electricista profesional', 'Instalación eléctrica, mantenimiento y reparación de cortocircuitos.', 'Electricidad', 40.00, 'Soyapango', 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1469'),
-- Jardinería
(gen_random_uuid(), 'Mantenimiento de jardines', 'Poda, limpieza y diseño de áreas verdes.', 'Jardinería', 30.00, 'Antiguo Cuscatlán', 'https://images.unsplash.com/photo-1611843467160-25afb8df1074?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Belleza
(gen_random_uuid(), 'Corte y peinado a domicilio', 'Estilista profesional con servicio personalizado.', 'Belleza', 20.00, 'Mejicanos', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1469'),
-- Mantenimiento
(gen_random_uuid(), 'Mantenimiento general del hogar', 'Servicios de mantenimiento preventivo y correctivo.', 'Mantenimiento', 50.00, 'Santa Ana', 'https://plus.unsplash.com/premium_photo-1723863635114-582d44ddae3b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1514'),
-- Reparaciones
(gen_random_uuid(), 'Reparación de electrodomésticos', 'Arreglo de refrigeradoras, lavadoras y microondas.', 'Reparaciones', 45.00, 'San Miguel', 'https://images.unsplash.com/photo-1563770660941-20978e870e26?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Pintura
(gen_random_uuid(), 'Pintura de interiores y exteriores', 'Servicios de pintura profesional para casas y oficinas.', 'Pintura', 60.00, 'La Libertad', 'https://plus.unsplash.com/premium_photo-1723662253911-db2eaa3324be?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1493'),
-- Carpintería
(gen_random_uuid(), 'Muebles a medida', 'Diseño y construcción de muebles personalizados.', 'Carpintería', 80.00, 'San Salvador', 'https://images.unsplash.com/photo-1650211578919-b44b5521aaa1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Mudanzas
(gen_random_uuid(), 'Servicio de mudanzas', 'Traslado de muebles y pertenencias con cuidado y rapidez.', 'Mudanzas', 70.00, 'Soyapango', 'https://plus.unsplash.com/premium_photo-1675884215301-240f3fb01cec?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1469'),
-- Eventos
(gen_random_uuid(), 'Organización de eventos', 'Planificación completa de bodas, cumpleaños y reuniones.', 'Eventos', 120.00, 'Santa Tecla', 'https://plus.unsplash.com/premium_photo-1723471212652-06d5aea09548?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1146'),
-- Salud
(gen_random_uuid(), 'Consulta médica a domicilio', 'Médico general con atención personalizada.', 'Salud', 40.00, 'San Salvador', 'https://plus.unsplash.com/premium_photo-1673953510197-0950d951c6d9?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1471'),
-- Educación
(gen_random_uuid(), 'Clases particulares', 'Tutorías de matemáticas, inglés y ciencias.', 'Educación', 15.00, 'Santa Ana', 'https://plus.unsplash.com/premium_photo-1666299434616-9fafc0656de1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Tecnología
(gen_random_uuid(), 'Soporte técnico informático', 'Reparación de computadoras, laptops y redes domésticas.', 'Tecnología', 25.00, 'San Salvador', 'https://plus.unsplash.com/premium_photo-1678565546519-199bd54cf7d9?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Automotriz
(gen_random_uuid(), 'Mecánica automotriz', 'Diagnóstico y reparación de autos y motocicletas.', 'Automotriz', 75.00, 'Ilopango', 'https://plus.unsplash.com/premium_photo-1661963708371-f839fea49826?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Construcción
(gen_random_uuid(), 'Remodelaciones y construcción', 'Obras civiles, ampliaciones y acabados.', 'Construcción', 200.00, 'Santa Tecla', 'https://plus.unsplash.com/premium_photo-1663133650345-86c16f913d61?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1472'),
-- Diseño
(gen_random_uuid(), 'Diseño gráfico y branding', 'Creación de logos, branding y material digital.', 'Diseño', 30.00, 'San Salvador', 'https://images.unsplash.com/photo-1649000808933-1f4aac7cad9a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Cocina
(gen_random_uuid(), 'Chef a domicilio', 'Preparación de cenas y menús personalizados.', 'Cocina', 60.00, 'Antiguo Cuscatlán', 'https://images.unsplash.com/photo-1659354219145-dedd2324698e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Mascotas
(gen_random_uuid(), 'Paseo y cuidado de mascotas', 'Paseadores profesionales y cuidado a domicilio.', 'Mascotas', 18.00, 'Santa Tecla', 'https://picsum.photos/350/200?random=19'),
-- Transporte
(gen_random_uuid(), 'Transporte privado', 'Servicio de traslado seguro dentro del país.', 'Transporte', 50.00, 'San Miguel', 'https://images.unsplash.com/photo-1681744773444-b8a6bd598f4b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Seguridad
(gen_random_uuid(), 'Instalación de cámaras de seguridad', 'Montaje y configuración de sistemas de videovigilancia.', 'Seguridad', 90.00, 'San Salvador', 'https://images.unsplash.com/photo-1649182121472-26ea720befc6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1475'),
-- Consultoría
(gen_random_uuid(), 'Consultoría empresarial', 'Asesoría en procesos administrativos y gestión de negocios.', 'Consultoría', 100.00, 'Santa Ana', 'https://plus.unsplash.com/premium_photo-1664392373164-5aae3dbc7ea3?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1047'),
-- Fotografía
(gen_random_uuid(), 'Fotografía profesional', 'Sesiones fotográficas para eventos, productos y retratos.', 'Fotografía', 80.00, 'San Salvador', 'https://images.unsplash.com/photo-1735652306493-d28209cb0a08?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Música
(gen_random_uuid(), 'Clases de guitarra y piano', 'Profesor de música con experiencia en distintos géneros.', 'Música', 25.00, 'Santa Tecla', 'https://plus.unsplash.com/premium_photo-1681389283458-f9ba02998461?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470'),
-- Deportes
(gen_random_uuid(), 'Entrenador personal', 'Rutinas personalizadas y asesoramiento nutricional.', 'Deportes', 30.00, 'San Salvador', 'https://plus.unsplash.com/premium_photo-1663050901483-ee8703cc8372?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470');


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