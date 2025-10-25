# 🚀 Configuración de Base de Datos - Marketplace de Servicios

## 📋 Resumen
Este proyecto utiliza **Supabase** como backend para el marketplace de servicios. La base de datos está diseñada para manejar usuarios, servicios y reservas de manera segura y eficiente.

## 🗂️ Archivos Incluidos

### 1. `DATABASE_SCHEMA.md`
📄 **Documentación completa** del esquema de base de datos
- Descripción detallada de todas las tablas
- Relaciones entre entidades
- Políticas de seguridad (RLS)
- Índices recomendados
- Funciones útiles

### 2. `database_setup.sql`
⚡ **Script ejecutable** para configurar la base de datos
- Creación de tablas
- Configuración de seguridad
- Datos de ejemplo incluidos
- Verificación de instalación

## 🛠️ Pasos para Configurar la Base de Datos

### Paso 1: Crear Proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Anota tu **Project URL** y **anon/public key**

### Paso 2: Ejecutar el Script de Setup
1. En tu dashboard de Supabase, ve a **SQL Editor**
2. Copia y pega el contenido completo de `database_setup.sql`
3. Ejecuta el script (presiona **Run**)

### Paso 3: Configurar Variables de Entorno
1. Crea un archivo `.env` en la raíz del proyecto:
```env
SUPABASE_URL=tu_project_url_aqui
SUPABASE_ANON_KEY=tu_anon_key_aqui
```

2. También puedes configurar estas variables en `app.json`:
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "tu_project_url_aqui",
      "supabaseAnonKey": "tu_anon_key_aqui"
    }
  }
}
```

## 🏗️ Estructura de la Base de Datos

### Tablas Principales

#### 👤 `profiles` - Perfiles de Usuario
- Información adicional del usuario
- Tipo: cliente o proveedor
- Relacionada con Supabase Auth

#### 🛠️ `servicios` - Servicios Ofrecidos
- Servicios publicados por proveedores
- Información detallada del servicio
- Precios y ubicaciones

#### 📅 `reservas` - Reservas de Servicios
- Reservas realizadas por clientes
- Un cliente puede crear múltiples reservas para el mismo servicio, siempre que no haya una reserva activa (pendiente, confirmada o en proceso)
- Estados de seguimiento: pendiente, confirmada, en proceso, completada, cancelada
- Relaciones cliente-servicio con validación para evitar reservas duplicadas activas

## 🔐 Seguridad Implementada

### Row Level Security (RLS)
- ✅ Usuarios solo ven sus propios datos
- ✅ Proveedores gestionan sus servicios
- ✅ Clientes ven sus reservas
- ✅ Servicios públicos para navegación

### Políticas Configuradas
- `profiles`: CRUD propio
- `servicios`: Lectura pública, escritura por proveedor
- `reservas`: Gestión por cliente, lectura por involucrados, con validación para reservas activas

## 📊 Datos de Ejemplo Incluidos

El script incluye datos de ejemplo:
- **3 proveedores** con servicios variados
- **Servicios** en categorías: Limpieza, Plomería, Belleza
- **Precios** realistas para El Salvador

## 🔧 Funciones Disponibles

### `get_provider_services(provider_id)`
Obtiene todos los servicios de un proveedor específico.

### `get_client_bookings(client_id)`
Obtiene todas las reservas de un cliente específico.

### Funciones de Validación
- `validate_active_booking()`: Valida que no se creen reservas activas duplicadas para el mismo cliente y servicio.
- `validate_booking_state_transition()`: Valida las transiciones de estados en las reservas para mantener la integridad del flujo.

## 🚀 Próximos Pasos

1. **Configurar autenticación** en la aplicación móvil
2. **Implementar carga de imágenes** para servicios
3. **Agregar sistema de reseñas** (opcional)
4. **Configurar notificaciones push** (opcional)

## 🆘 Solución de Problemas

### Error de permisos RLS
```sql
-- Verificar políticas activas
SELECT * FROM pg_policies WHERE tablename = 'nombre_tabla';
```

### Problemas de conexión
- Verifica las variables de entorno
- Confirma que el proyecto de Supabase esté activo
- Revisa la configuración de CORS en Supabase

### Datos no aparecen
- Verifica que RLS esté habilitado correctamente
- Confirma que el usuario esté autenticado
- Revisa los logs de Supabase Dashboard

## 📞 Soporte

Para problemas específicos:
1. Consulta la documentación oficial de [Supabase](https://supabase.com/docs)
2. Revisa los logs en el Dashboard de Supabase
3. Verifica la configuración en `src/lib/supabaseClient.ts`

---

**🎉 ¡Tu base de datos está lista para usar!**

Una vez completada la configuración, podrás:
- ✅ Registrar usuarios (cliente/proveedor)
- ✅ Publicar servicios
- ✅ Realizar múltiples reservas para el mismo servicio (siempre que no haya reservas activas)
- ✅ Gestionar perfiles