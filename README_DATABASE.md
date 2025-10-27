# Documentación del Esquema de Base de Datos - Marketplace de Servicios

## Descripción General
Este documento describe el esquema de base de datos necesario para el marketplace de servicios desarrollado con React Native y Supabase.

## Entidades Principales

### 1. Perfiles de Usuario (Tabla: `profiles`)
Información adicional de los usuarios más allá de la autenticación básica de Supabase Auth.

**Campos:**
- `id` (UUID, Primary Key) - Referencia al usuario de Supabase Auth
- `full_name` (TEXT) - Nombre completo del usuario
- `phone` (TEXT) - Número de teléfono
- `user_type` (TEXT) - Tipo de usuario: 'cliente' o 'proveedor'
- `created_at` (TIMESTAMP) - Fecha de creación automática
- `updated_at` (TIMESTAMP) - Fecha de actualización automática

### 2. Servicios (Tabla: `servicios`)
Servicios ofrecidos por los proveedores en el marketplace.

**Campos:**
- `id` (UUID, Primary Key) - Identificador único del servicio
- `id_proveedor` (UUID, Foreign Key) - Referencia al proveedor (usuario)
- `titulo` (TEXT, NOT NULL) - Título del servicio
- `descripcion` (TEXT) - Descripción detallada del servicio
- `categoria` (TEXT, NOT NULL) - Categoría del servicio (ej: limpieza, plomería, etc.)
- `precio` (DECIMAL/NUMERIC, NOT NULL) - Precio del servicio
- `ubicacion` (TEXT) - Ubicación donde se ofrece el servicio
- `imagen_url` (TEXT) - URL de la imagen del servicio
- `created_at` (TIMESTAMP) - Fecha de creación automática
- `updated_at` (TIMESTAMP) - Fecha de actualización automática

### 3. Reservas (Tabla: `reservas`)
Reservas realizadas por clientes para servicios específicos. Un cliente puede crear múltiples reservas para el mismo servicio, siempre y cuando no haya una reserva activa (pendiente, confirmada o en proceso) para ese servicio.

**Campos:**
- `id` (UUID, Primary Key) - Identificador único de la reserva
- `id_cliente` (UUID, Foreign Key) - Referencia al cliente que hace la reserva
- `id_servicio` (UUID, Foreign Key) - Referencia al servicio reservado
- `fecha` (DATE, NOT NULL) - Fecha programada para el servicio
- `estado` (TEXT, NOT NULL) - Estado de la reserva: 'pendiente', 'confirmada', 'en proceso', 'completada', 'cancelada'
- `created_at` (TIMESTAMP) - Fecha de creación automática
- `updated_at` (TIMESTAMP) - Fecha de actualización automática

**Validaciones:**
- No se permite crear una nueva reserva para un servicio si el cliente ya tiene una reserva activa (pendiente, confirmada o en proceso) para ese mismo servicio.
- Las transiciones de estado están validadas para mantener la integridad del flujo de reservas.

## Relaciones entre Tablas

### Relación Usuario-Perfil (1:1)
- Cada usuario de Supabase Auth tiene un perfil correspondiente
- La tabla `profiles` referencia al `auth.users` de Supabase mediante el campo `id`

### Relación Proveedor-Servicios (1:N)
- Un proveedor puede ofrecer múltiples servicios
- Cada servicio pertenece a un proveedor específico
- **Foreign Key:** `servicios.id_proveedor` → `profiles.id`

### Relación Cliente-Servicios (N:M a través de reservas)
- Un cliente puede reservar múltiples servicios y múltiples veces el mismo servicio, siempre que no haya reservas activas
- Un servicio puede ser reservado por múltiples clientes
- **Foreign Keys:**
  - `reservas.id_cliente` → `profiles.id`
  - `reservas.id_servicio` → `servicios.id`
- **Validación:** No se permite crear una nueva reserva para un servicio si el cliente ya tiene una reserva activa (pendiente, confirmada o en proceso) para ese servicio.

## Índices Recomendados

Para optimizar el rendimiento, se recomienda crear los siguientes índices:

```sql
-- Índice para buscar servicios por proveedor
CREATE INDEX idx_servicios_proveedor ON servicios(id_proveedor);

-- Índice para buscar servicios por categoría
CREATE INDEX idx_servicios_categoria ON servicios(categoria);

-- Índice para buscar reservas por cliente
CREATE INDEX idx_reservas_cliente ON reservas(id_cliente);

-- Índice para buscar reservas por servicio
CREATE INDEX idx_reservas_servicio ON reservas(id_servicio);

-- Índice para buscar reservas por estado
CREATE INDEX idx_reservas_estado ON reservas(estado);

-- Índice para buscar reservas por fecha
CREATE INDEX idx_reservas_fecha ON reservas(fecha);
```

## Políticas de Seguridad (RLS - Row Level Security)

### Tabla `profiles`:
```sql
-- Los usuarios pueden ver y editar solo su propio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

### Tabla `servicios`:
```sql
-- Los proveedores pueden gestionar sus propios servicios
-- Cualquier usuario autenticado puede ver servicios activos
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view services" ON servicios
    FOR SELECT USING (true);

CREATE POLICY "Providers can insert own services" ON servicios
    FOR INSERT WITH CHECK (auth.uid() = id_proveedor);

CREATE POLICY "Providers can update own services" ON servicios
    FOR UPDATE USING (auth.uid() = id_proveedor);

CREATE POLICY "Providers can delete own services" ON servicios
    FOR DELETE USING (auth.uid() = id_proveedor);
```

### Tabla `reservas`:
```sql
-- Los clientes pueden ver sus propias reservas
-- Los proveedores pueden ver las reservas de sus servicios
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

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
```

## Script SQL para Crear las Tablas

```sql
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

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at BEFORE UPDATE ON servicios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at BEFORE UPDATE ON reservas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Funciones de Validación

### Función para validar reservas activas:
```sql
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
```

### Función para validar transiciones de estados:
```sql
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
```

## Funciones Útiles

### Función para obtener servicios de un proveedor:
```sql
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
```

### Función para obtener reservas de un cliente:
```sql
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
```

### Función para obtener perfil por email (para verificación TOTP):
```sql
CREATE OR REPLACE FUNCTION public.fn_get_profile_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  otp_secret TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.otp_secret
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE u.email = p_email;
END;
$$ LANGUAGE plpgsql;
```

## Configuración Inicial de Datos

### Crear perfil automáticamente al registrarse:
```sql
-- Función que se ejecuta cuando se crea un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, user_type)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'cliente');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Consideraciones de Despliegue

1. **Backup y recuperación**: Implementar estrategias de backup automático
2. **Monitoreo**: Configurar alertas para tablas con alto volumen de operaciones
3. **Escalabilidad**: Considerar particionamiento para la tabla de reservas si crece mucho
4. **Mantenimiento**: Programar tareas de limpieza periódica para reservas antiguas completadas

## Próximas Mejoras Sugeridas

1. **Sistema de reseñas**: Agregar tabla para reseñas de servicios
2. **Notificaciones**: Sistema de notificaciones push
3. **Pagos**: Integración con pasarelas de pago
4. **Geolocalización**: Índices espaciales para búsqueda por ubicación
5. **Sistema de chat**: Comunicación entre clientes y proveedores