# ViaFit — Organizador de comidas

App web para planificar la semana de comidas, publicar recetas y likear las de otras personas.
React + Vite (JavaScript), Firebase Authentication (Google) y Cloud Firestore. Deploy en Vercel.

## Ejecutar en local

```bash
npm install
cp .env.example .env   # en Windows: copiá el archivo y renombralo a .env
npm run dev
```

Completá `.env` con la configuración de tu app web de Firebase (Project settings → Your apps).
Reiniciá `npm run dev` cada vez que cambies `.env`.

## Configurar Firebase

1. Authentication → Sign-in method → habilitar **Google**.
2. Firestore Database → crear base `(default)` en modo producción.
3. Firestore → Rules → pegar el contenido de `firestore.rules` y **Publicar**.
4. Authentication → Settings → Authorized domains → agregar el dominio de Vercel.

## Datos en Firestore

- `recipes/{id}`: title, category, difficulty, time, servings, ingredients, steps, image, authorId, authorName, createdAt
- `recipes/{id}/likes/{uid}`: createdAt (un documento por usuario que dio like)
- `users/{uid}/mealPlan/{id}`: day, type, title, recipeId (opcional), done, createdAt

## Operaciones

- **Crear:** recetas, comidas del plan, likes.
- **Leer:** en tiempo real con `onSnapshot`.
- **Modificar:** marcar una comida como hecha.
- **Eliminar:** recetas propias, comidas del plan, likes.
- **Eliminar:** recetas propias, comidas del plan, likes.
- **Fotos:** se achican en el navegador (máximo 900 px) y se guardan como texto dentro del propio documento de la receta en Firestore, sin usar Firebase Storage.

## Deploy en Vercel

Importar el repo, preset Vite, build `npm run build`, salida `dist`, y cargar las cinco variables
`VITE_FIREBASE_*` en Settings → Environment Variables (Production). Redeploy si se cambian después.
