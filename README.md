# Nexa - Conectando PYMEs entre Regiones 🚀

Nexa es una aplicación móvil multiplataforma que facilita la conexión entre pequeñas y medianas empresas (PYMEs) de diferentes sectores (cosmética, electrónica, alimentos, etc.) ubicadas en diferentes regiones.

## 📱 Características Principales

- **Registro de PYMEs**: Crea un perfil empresarial completo con información de tu negocio
- **Búsqueda por Región**: Encuentra empresas en tu zona o en otras regiones
- **Filtrado por Sector**: Localiza PYMEs específicas (cosmética, electrónica, alimentos, etc.)
- **Conectar Empresas**: Sistema de contacto directo entre negocios
- **Mensajería**: Chat integrado para comunicación en tiempo real
- **Portafolio de Productos**: Muestra tus productos/servicios con imágenes
- **Calificaciones y Reseñas**: Sistema de valoración entre empresas
- **Geolocalización**: Ubicación de empresas en mapas

## 🛠 Tech Stack

- **Frontend**: React Native (Expo) - iOS y Android
- **Backend**: Firebase + Cloud Functions
- **Base de Datos**: Firestore
- **Autenticación**: Firebase Authentication
- **Storage**: Firebase Storage (imágenes y documentos)
- **Hosting**: Firebase Hosting

## 📁 Estructura del Proyecto

```
nexa/
├── mobile/                 # Aplicación React Native (Expo)
│   ├── app/
│   │   ├── screens/       # Pantallas de la app
│   │   ├── components/    # Componentes reutilizables
│   │   ├── navigation/    # Navegación
│   │   └── config/        # Configuración Firebase
│   ├── assets/            # Imágenes, fuentes, etc.
│   └── app.json
│
├── firebase/              # Backend Firebase
│   ├── functions/         # Cloud Functions
│   ├── firestore.rules    # Reglas de seguridad
│   └── storage.rules
│
├── docs/                  # Documentación
│   └── API.md
│
└── README.md
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js (v16+)
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- Cuenta en Firebase

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/melibelensof-debug/nexa.git
cd nexa
```

2. **Configurar Firebase**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
   - Descarga tus credenciales
   - Configúralas en `mobile/app/config/firebase.js`

3. **Instalar dependencias (Mobile)**
```bash
cd mobile
npm install
```

4. **Instalar dependencias (Firebase Functions)**
```bash
cd firebase/functions
npm install
```

5. **Ejecutar la app**
```bash
cd mobile
expo start
```

## 📋 Roadmap

- [x] Estructura inicial del proyecto
- [ ] Autenticación de usuarios
- [ ] Registro de PYMEs
- [ ] Búsqueda y filtrado
- [ ] Sistema de mensajería
- [ ] Geolocalización
- [ ] Calificaciones y reseñas
- [ ] Notificaciones push
- [ ] Versión web (opcional)

## 👥 Contribución

Este proyecto está en fase inicial. Las contribuciones son bienvenidas.

## 📄 Licencia

MIT License

## 📧 Contacto

Para más información: contacto@nexa.app

---

**¡Bienvenido al futuro del comercio entre PYMEs!** 🌟
