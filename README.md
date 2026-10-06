# RedSolidaria

Web App comunitaria construida con **Angular 21 (standalone)**, **Tailwind CSS v4** y **Firebase** (Authentication + Cloud Firestore).

## Características

- **Dashboard principal** con filtros dinámicos por categoría y nivel de urgencia.
- **Tarjetas de solicitudes** cargadas desde Firestore (con fallback a datos de ejemplo si no hay conexión).
- **Botón "Ofrecer ayuda"** que cambia el estado de la solicitud en tiempo real (activa → en_proceso → resuelta).
- **Modal para crear solicitudes** con formulario reactivo que guarda directamente en Firestore.
- **Sección de campañas colectivas** con barras de progreso y donación simulada.
- **Perfil de voluntario** con puntos de confianza, medallas y contador de ayudas.
- **Autenticación** simulada/real con Firebase Auth.

## Configuración de Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com).
2. Habilita **Authentication** → método Email/Password.
3. Crea una base de datos en **Cloud Firestore** (modo de prueba).
4. Copia la configuración del SDK (Project Settings → Your apps → Web app) y pégala en `src/environments/firebase.config.ts`.
5. Cambia `useMockMode` a `false` en ese mismo archivo para usar Firebase real.

```typescript
export const firebaseConfig = {
  apiKey: 'TU_API_KEY',
  authDomain: 'tu-proyecto.firebaseapp.com',
  projectId: 'tu-proyecto',
  // ...
};

export const useMockMode = false;
```

## Desarrollo local

```bash
npm install
npm start
```

La app se sirve en `http://localhost:4200`.

## Despliegue con Firebase Hosting

```bash
# 1. Compilar la app
npm run build

# 2. Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# 3. Iniciar sesión
firebase login

# 4. Asociar el proyecto
firebase use --add tu-proyecto

# 5. Desplegar
firebase deploy
```

El archivo `firebase.json` ya está configurado para servir `dist/demo/browser` con rewrites SPA.

## Estructura del proyecto

```
src/
├── app/
│   ├── app.component.ts          # Shell principal (nav + routing + auth modal)
│   ├── components/
│   │   ├── auth-modal.component.ts
│   │   └── create-solicitud-modal.component.ts
│   ├── pages/
│   │   ├── dashboard.component.ts
│   │   ├── campanas.component.ts
│   │   └── perfil.component.ts
│   ├── models/
│   │   └── models.ts             # Interfaces TypeScript
│   └── services/
│       └── firebase.service.ts   # Servicio de Firebase + mock fallback
├── environments/
│   └── firebase.config.ts        # Config de Firebase
└── main.ts                       # Bootstrap + routing
```
