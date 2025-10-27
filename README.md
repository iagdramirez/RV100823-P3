# Marketplace de Servicios

Una aplicación móvil desarrollada con React Native y Expo que conecta proveedores de servicios con clientes. Los usuarios pueden registrarse como clientes o proveedores, publicar servicios, buscar y reservar servicios de manera segura y eficiente.

## 🚀 Características Principales

- **Autenticación segura** con Supabase Auth y verificación TOTP opcional.
- **Perfiles diferenciados**: Clientes y proveedores con interfaces personalizadas.
- **Gestión de servicios**: Proveedores pueden crear, editar y eliminar sus servicios.
- **Búsqueda y reservas**: Clientes pueden buscar servicios por categoría y reservar con validaciones automáticas.
- **Estados de reservas**: Seguimiento completo desde pendiente hasta completada.
- **Interfaz moderna** con Tailwind CSS y navegación intuitiva.

## 📋 Requisitos Previos

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **Expo CLI** (instalado globalmente: `npm install -g @expo/cli`)
- **Cuenta en Supabase** para el backend
- **Dispositivo o emulador** para probar la app (Android/iOS)

## 🛠️ Instalación

1. **Clona el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd marketplace-services
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Configura Supabase** (ver sección de Configuración de Base de Datos).

4. **Inicia la aplicación**:
   ```bash
   npm start
   ```

   Esto abrirá el menú de Expo. Puedes escanear el código QR con la app Expo Go en tu dispositivo o usar un emulador.

## ⚙️ Configuración de Base de Datos

Este proyecto utiliza **Supabase** como backend. Sigue estos pasos para configurarlo:

### 1. Crear Proyecto en Supabase
- Ve a [supabase.com](https://supabase.com) y crea una cuenta.
- Crea un nuevo proyecto.
- Anota tu **Project URL** y **anon/public key**.

### 2. Ejecutar el Script de Setup
- En el dashboard de Supabase, ve a **SQL Editor**.
- Copia y pega el contenido completo de `database_setup.sql`.
- Ejecuta el script para crear tablas, políticas y funciones.

### 3. Configurar Variables de Entorno
Las claves de Supabase ya están configuradas en `app.json`:
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://tu-project-url.supabase.co",
      "supabaseAnonKey": "tu-anon-key-aqui"
    }
  }
}
```
Reemplaza con tus propias claves.

## 🚀 Ejecución

- **Desarrollo**: `npm start` o `expo start`
- **Android**: `npm run android` o `expo run:android`
- **iOS**: `npm run ios` o `expo run:ios`
- **Web**: `npm run web` o `expo start --web`
- **Linting**: `npm run lint`

## 📁 Estructura del Proyecto

```
marketplace-services/
├── app/                          # Código principal de la aplicación
│   ├── components/               # Componentes reutilizables (Button, Header, etc.)
│   ├── contexts/                 # Contextos de React (ProfileContext)
│   ├── hooks/                    # Hooks personalizados (useAuth, useServices, etc.)
│   ├── screens/                  # Pantallas de la app (Home, Login, Profile, etc.)
│   └── index.tsx                 # Punto de entrada de la app
├── assets/                       # Imágenes y recursos estáticos
├── lib/                          # Utilidades y configuraciones (supabaseClient, transiciones)
├── database_setup.sql            # Script para configurar la base de datos
├── package.json                  # Dependencias y scripts
├── app.json                      # Configuración de Expo
├── tsconfig.json                 # Configuración de TypeScript
├── README_DATABASE.md            # Esquema completo de la base de datos
└── README.md                     # Este archivo
```

## 🔧 Funcionalidades

### Autenticación y Perfiles
- Registro y login con email y contraseña.
- **Verificación TOTP opcional**: Los usuarios pueden activar autenticación de dos factores.
- Setup inicial de perfil: nombre, teléfono y tipo (cliente/proveedor).
- Perfiles automáticos creados al registrarse.

### Para Proveedores
- **Publicar servicios**: Título, descripción, categoría, precio, ubicación e imagen.
- **Gestionar servicios**: Editar o eliminar servicios propios.
- **Ver reservas**: Acceso a reservas de sus servicios.

### Para Clientes
- **Buscar servicios**: Por nombre o categoría con barra de búsqueda.
- **Reservar servicios**: Seleccionar fecha y confirmar reserva.
- **Gestionar reservas**: Ver historial y estados de reservas.

### Estados de Reservas
- **Pendiente**: Esperando confirmación.
- **Confirmada**: Aceptada y lista para ejecutar.
- **En proceso**: Servicio en ejecución.
- **Completada**: Finalizada exitosamente.
- **Cancelada**: Cancelada por alguna de las partes.

**Validaciones**: No se permiten reservas activas duplicadas para el mismo cliente y servicio.

## 🗄️ Base de Datos

### Tablas Principales
- **profiles**: Información de usuarios (nombre, teléfono, tipo).
- **servicios**: Servicios ofrecidos (título, descripción, precio, etc.).
- **reservas**: Reservas con estados y fechas.

### Seguridad
- **Row Level Security (RLS)** habilitado en todas las tablas.
- Políticas para acceso basado en roles (usuarios ven solo sus datos).
- Validaciones automáticas para transiciones de estados y reservas duplicadas.

### Funciones Útiles
- `get_provider_services(provider_id)`: Obtiene servicios de un proveedor.
- `get_client_bookings(client_id)`: Obtiene reservas de un cliente.
- `fn_get_profile_by_email(email)`: Obtiene perfil y secreto TOTP por email para verificación previa al login.
- Validaciones para reservas activas y transiciones de estados.

Para más detalles, consulta `DATABASE_README.md`.

## 🎨 Tecnologías Utilizadas

- **Frontend**: React Native, Expo, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Navegación**: React Navigation (Stack y Bottom Tabs)
- **Estilos**: NativeWind (Tailwind para React Native)
- **Autenticación**: Supabase Auth con persistencia en AsyncStorage

## 🤝 Contribución

1. Fork el proyecto.
2. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`.
3. Commit tus cambios: `git commit -m 'Agrega nueva funcionalidad'`.
4. Push a la rama: `git push origin feature/nueva-funcionalidad`.
5. Abre un Pull Request.

## 📝 Notas Adicionales

- La app está configurada para desarrollo con Expo, facilitando pruebas en dispositivos reales.
- Asegúrate de configurar correctamente las claves de Supabase para evitar errores de conexión.
- Para producción, considera configurar notificaciones push y pagos integrados.

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia MIT. Ver `LICENSE` para más detalles.

---