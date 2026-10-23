# Firmeza.Frontend — Enterprise Asset, Inventory & Purchase Portal (React 19 + TypeScript)

Aplicación web SPA empresarial para **Firmeza**, diseñada con **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS 3.4**, **TanStack Query v5** y **React Hook Form + Zod**. Proporciona una interfaz de alta densidad informativa y diseño **Responsive Mobile-First & Tablet-Ready** (sin scroll horizontal) para la gestión de activos físicos, gobierno de identidades RBAC y flujo de **Carrito de Compras con Aprobación Administrativa**.

---

## Tabla de Contenidos

1. [Características Principales y Experiencia de Usuario](#1-características-principales-y-experiencia-de-usuario)
2. [Arquitectura y Estructura de Carpetas](#2-arquitectura-y-estructura-de-carpetas)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Módulos y Vistas de la Aplicación](#4-módulos-y-vistas-de-la-aplicación)
5. [Credenciales de Prueba (Seed Users)](#5-credenciales-de-prueba-seed-users)
6. [Manejo Inteligente de Errores y Seguridad HTTP](#6-manejo-inteligente-de-errores-y-seguridad-http)
7. [Instalación, Scripts y Despliegue con Docker](#7-instalación-scripts-y-despliegue-con-docker)

---

## 1. Características Principales y Experiencia de Usuario

- **Diseño Responsive Adaptativo (Cero Sidescrolling)**:
  - **Móviles (`< 640px`)**: Vista de tarjetas de 1 columna optimizada para pantallas táctiles, con controles de cantidad y acciones principales de ancho completo y modales estilo *Bottom Sheet*.
  - **Tablets (`640px – 1279px`)**: Cuadrícula simétrica de **2 tarjetas por fila** (`sm:grid-cols-2`) y menú lateral deslizable (*Drawer*), eliminando cualquier desplazamiento horizontal.
  - **Escritorio (`1280px+`)**: Tabla compacta de distribución proporcional (`table-fixed`) libre de scroll horizontal y selector manual para alternar entre **Vista Cuadrícula** y **Vista Tabla**.
- **Navegabilidad Avanzada del Catálogo**:
  - Búsqueda instantánea por código SKU, nombre o especificación técnica.
  - Filtros combinables por categoría y estado del ciclo de vida (`Active`, `Out of Stock`, `Draft`, `Discontinued`).
  - Ordenamiento rápido en cliente por **Nombre (A-Z)**, **Precio (Menor a Mayor / Mayor a Menor)** y **Stock (Menor a Mayor / Mayor a Menor)**.
  - Paginación numerada con salto directo de página y selector de tamaño de página (`10`, `20` o `50` registros).
- **Sistema de Carrito de Compras Aprobado**:
  - Carrito persistente en `localStorage` con indicador de unidades en tiempo real en la barra superior (`Navbar`).
  - Panel deslizable (`CartDrawer`) con ajuste de cantidades validado contra el tope de stock de cada activo.
  - Captura obligatoria de **Punto de Entrega**, **Método de Pago** (`Efectivo contra entrega`, `Transferencia Bancaria`, `Crédito Corporativo`, `Datáfono contra entrega`) y notas adicionales.
  - Centro de pedidos (`/orders`) diferenciado para operadores (seguimiento de aprobaciones/rechazos) y administradores (bandeja de aprobación con descuento automático de stock).
- **Identidad y Seguridad RBAC Completa**:
  - Inicio de sesión con opción *"Remember me"* (`localStorage` vs `sessionStorage`) y alternador para mostrar/ocultar contraseña.
  - Registro público de nuevos operadores con indicador visual en vivo de los 5 requisitos de complejidad de contraseña (asigna automáticamente el rol `StandardUser`).
  - Recuperación de contraseña y desbloqueo de cuenta mediante token de ASP.NET Core Identity (`/forgot-password`).
  - Gestión de perfil personal y rotación de contraseña (`/profile`).
  - Consola administrativa de usuarios y roles (`/users`) exclusiva para `Administrator`.

---

## 2. Arquitectura y Estructura de Carpetas

El proyecto sigue una arquitectura modular orientada a dominios funcionales (**Feature-Sliced Design**):

```text
Firmeza.Frontend/
├── Dockerfile                                  # Build multi-etapa (Node 22 Bookworm -> Nginx Alpine)
├── nginx.conf                                  # Configuración SPA fallback + Proxy inverso /api/
├── package.json                                # Dependencias y scripts de construcción
├── tailwind.config.js                          # Paleta corporativa y tokens de diseño
└── src/
    ├── App.tsx                                 # Enrutador principal, proveedores globales y rutas protegidas
    ├── main.tsx                                # Punto de entrada React 19
    ├── index.css                               # Estilos base y directivas Tailwind CSS
    ├── components/
    │   ├── layout/
    │   │   ├── MainLayout.tsx                  # Contenedor principal con Navbar, Sidebar y CartDrawer
    │   │   ├── Navbar.tsx                      # Barra superior con acceso al carrito y sesión activa
    │   │   ├── Sidebar.tsx                     # Navegación lateral adaptativa (estática en desktop, drawer en móvil)
    │   │   └── ProtectedRoute.tsx              # Guardián de rutas autenticadas y validación de roles
    │   └── ui/
    │       ├── ToastContext.tsx                # Sistema de notificaciones flotantes (Success, Error, Warning, Info)
    │       └── ConfirmDialog.tsx               # Diálogo modal de confirmación para acciones destructivas
    │
    ├── features/
    │   ├── auth/
    │   │   ├── components/
    │   │   │   ├── LoginForm.tsx               # Formulario de acceso con validación Zod y manejo de errores
    │   │   │   └── RegisterForm.tsx            # Registro de operadores con medidor de política de contraseña
    │   │   ├── context/
    │   │   │   └── AuthContext.tsx             # Estado global de sesión JWT, roles y persistencia
    │   │   ├── services/
    │   │   │   └── authService.ts              # Cliente HTTP para /auth y /users
    │   │   └── types/
    │   │       └── auth.types.ts               # Contratos TypeScript de autenticación y perfiles Identity
    │   │
    │   ├── categories/
    │   │   ├── services/categoryService.ts     # Consulta de categorías de inventario
    │   │   └── types/category.types.ts
    │   │
    │   ├── products/
    │   │   ├── components/
    │   │   │   ├── ProductTable.tsx            # Catálogo responsive (Tarjetas + Tabla), KPIs, filtros y paginación
    │   │   │   ├── ProductModal.tsx            # Modal de creación y edición de activos SKU
    │   │   │   ├── ProductDetailModal.tsx      # Ficha técnica detallada, auditoría y descarga de PDF
    │   │   │   └── ProductImportModal.tsx      # Asistente de carga masiva desde Excel (.xlsx)
    │   │   ├── services/productService.ts      # Cliente HTTP para CRUD, exportación Excel/PDF e importación
    │   │   └── types/product.types.ts
    │   │
    │   └── orders/
    │       ├── components/
    │       │   └── CartDrawer.tsx              # Panel lateral del carrito con punto de entrega y método de pago
    │       ├── context/
    │       │   └── CartContext.tsx             # Estado global del carrito sincronizado con localStorage
    │       ├── services/
    │       │   └── orderService.ts             # Cliente HTTP para envío, consulta, aprobación y rechazo de carritos
    │       └── types/
    │           └── order.types.ts              # Tipos y diccionarios de estado de orden y métodos de pago
    │
    ├── pages/
    │   ├── LoginPage.tsx                       # Página de inicio de sesión
    │   ├── RegisterPage.tsx                    # Página de registro de cuenta
    │   ├── ForgotPasswordPage.tsx              # Flujo de recuperación de contraseña y desbloqueo
    │   ├── ProductsPage.tsx                    # Vista principal del catálogo e inventario
    │   ├── OrdersPage.tsx                      # Bandeja de solicitudes de compra y aprobación administrativa
    │   ├── ProfilePage.tsx                     # Perfil de usuario y cambio de contraseña
    │   └── UsersPage.tsx                       # Administración de usuarios, roles RBAC y bloqueos
    │
    └── services/
        └── apiClient.ts                        # Instancia Axios, inyección JWT y extractor inteligente de errores
```

---

## 3. Stack Tecnológico

| Categoría | Tecnología | Versión | Uso en el Proyecto |
| :--- | :--- | :--- | :--- |
| **Librería UI** | React + React DOM | `19.2.8` | Construcción de interfaz declarativa basada en componentes |
| **Tipado Estático** | TypeScript | `~6.0.2` | Seguridad de tipos de extremo a extremo |
| **Bundler & Dev Server** | Vite | `^8.3.0` | Empaquetado ultrarrápido con Rolldown |
| **Estilos** | Tailwind CSS | `^3.4.19` | Diseño utilitario responsive y sistema de diseño corporativo |
| **Estado del Servidor** | TanStack React Query | `^5.104.0` | Caché, sincronización, paginación e invalidación de consultas API |
| **Formularios y Esquemas** | React Hook Form + Zod | `^7.89.0` / `^4.6.5` | Validación reactiva en cliente con esquemas tipados |
| **Enrutamiento** | React Router DOM | `^7.18.4` | Navegación SPA y protección de rutas por rol |
| **Cliente HTTP** | Axios | `^1.20.0` | Peticiones REST, manejo de blobs binarios (`.xlsx`/`.pdf`) e interceptores |
| **Iconografía** | Lucide React | `^1.48.0` | Iconos vectoriales consistentes |
| **Servidor Producción** | Nginx (Alpine) | `stable` | Servidor web ligero para contenedor Docker |

---

## 4. Módulos y Vistas de la Aplicación

| Ruta | Vista | Acceso | Funcionalidad Principal |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Público | Autenticación JWT, opción *Remember me* y enlace a recuperación de cuenta. |
| `/register` | `RegisterPage` | Público | Creación de cuenta de operador (`StandardUser`) con validación en tiempo real. |
| `/forgot-password` | `ForgotPasswordPage` | Público | Generación de token de seguridad y restablecimiento de contraseña. |
| `/products` | `ProductsPage` | Autenticado | Catálogo responsive de activos, KPIs de valoración, filtros, exportación Excel/PDF y botón de agregar al carrito. |
| `/orders` | `OrdersPage` | Autenticado | Seguimiento de compras propias (Operador) o panel de aprobación/rechazo de carritos con descuento de stock (Administrador). |
| `/profile` | `ProfilePage` | Autenticado | Edición de datos personales de Identity y rotación de contraseña. |
| `/users` | `UsersPage` | `Administrator` | Gobernanza de operadores: alta de usuarios, asignación de rol RBAC, bloqueo/desbloqueo y reseteo de clave. |

---

## 5. Credenciales de Prueba (Seed Users)

Cuentas disponibles automáticamente al iniciar el Backend:

| Rol del Sistema | Nombre Completo | Correo Electrónico | Contraseña | Alcance en la Interfaz |
| :--- | :--- | :--- | :--- | :--- |
| **`Administrator`** | System Administrator | `admin@enterprise.com` | `Admin@123456` | Acceso completo a `/products` (crear/editar/importar/eliminar), `/orders` (aprobar/rechazar compras), `/users` y `/profile`. |
| **`Auditor`** | Compliance Auditor | `auditor@enterprise.com` | `Auditor@123456` | Inspección de catálogo, exportación Excel/PDF y supervisión global de órdenes en `/orders`. |
| **`StandardUser`** | Standard Operator | `user@enterprise.com` | `User@123456` | Consulta de catálogo, armado y envío de carritos de compra, seguimiento de estado en `/orders` y gestión de perfil en `/profile`. |

---

## 6. Manejo Inteligente de Errores y Seguridad HTTP

En [`src/services/apiClient.ts`](src/services/apiClient.ts):
- **Inyección automática de JWT**: El interceptor de salida adjunta `Authorization: Bearer <token>` desde `localStorage` o `sessionStorage`.
- **Normalización de errores (`extractApiErrorMessage`)**: El interceptor de respuesta analiza automáticamente respuestas `ProblemDetails`, `ValidationProblemDetails`, arreglos `errors` de Identity y errores de red para mostrar siempre mensajes claros en español (por ejemplo, *"La contraseña ingresada es incorrecta. Te quedan 4 intento(s) antes del bloqueo temporal"*) en lugar de códigos técnicos crudos como `Error 400`.
- **Descarga de binarios**: Función `downloadFileBlob` compatible con cabeceras `Content-Disposition` RFC 5987 para reportes `.xlsx` y `.pdf`.

---

## 7. Instalación, Scripts y Despliegue con Docker

### Variables de Entorno
Puedes configurar la URL del backend mediante la variable `VITE_API_URL` (por defecto apunta a `http://localhost:5193/api/v1`).

### Ejecución Local en Desarrollo
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo en http://localhost:5173
npm run dev

# 3. Compilar bundle de producción (TypeScript + Vite)
npm run build

# 4. Verificar calidad de código con ESLint
npm run lint
```

### Ejecución con Docker Compose (Desde la raíz del proyecto)
```bash
docker compose up --build -d
```
La aplicación quedará disponible en **`http://localhost:5173`**.
