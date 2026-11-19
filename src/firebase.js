// src/firebase.js
// Conexión de ViaFit con Firebase (Auth con Google + Cloud Firestore).
// Lee la configuración desde el archivo .env (variables VITE_FIREBASE_*).

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

// ---------------------------------------------------------------------------
// 1. Configuración e inicialización
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
}

// Aviso útil si falta alguna variable (por ejemplo, en Vercel sin cargar).
const faltantes = ['apiKey', 'authDomain', 'projectId', 'appId'].filter(
  (clave) => !firebaseConfig[clave]
)
if (faltantes.length > 0) {
  console.error(
    `[Firebase] Faltan variables de entorno: ${faltantes.join(', ')}. ` +
      'Revisá el archivo .env (o Settings → Environment Variables en Vercel).'
  )
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

// ---------------------------------------------------------------------------
// 2. Autenticación con Google
// ---------------------------------------------------------------------------

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// Abre el popup de Google. Devuelve el usuario o lanza un error.
export async function loginConGoogle() {
  const resultado = await signInWithPopup(auth, googleProvider)
  return resultado.user
}

export function cerrarSesion() {
  return signOut(auth)
}

// Avisa cada vez que el usuario entra o sale. Devuelve la función para dejar de escuchar.
// Uso: useEffect(() => escucharSesion(setUser), [])
export function escucharSesion(callback) {
  return onAuthStateChanged(auth, callback)
}

// ---------------------------------------------------------------------------
// 3. Recetas públicas  →  colección: recipes/{recipeId}
//    (coincide con las reglas: solo el autor edita o borra)
// ---------------------------------------------------------------------------

export async function crearReceta(user, datos) {
  // datos: { title, ingredients, steps, category, ... }
  return addDoc(collection(db, 'recipes'), {
    ...datos,
    authorId: user.uid, // las reglas exigen que sea igual a request.auth.uid
    authorName: user.displayName ?? 'Anónimo',
    createdAt: serverTimestamp(),
  })
}

export function escucharRecetas(onData, onError) {
  const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )
}

export function editarReceta(recipeId, cambios) {
  return setDoc(doc(db, 'recipes', recipeId), cambios, { merge: true })
}

export function eliminarReceta(recipeId) {
  return deleteDoc(doc(db, 'recipes', recipeId))
}

// ---------------------------------------------------------------------------
// 4. Likes  →  recipes/{recipeId}/likes/{uid}
//    Un documento por usuario: evita likes duplicados y no requiere
//    modificar el documento de la receta (que solo puede editar su autor).
// ---------------------------------------------------------------------------

// Escucha los likes de una receta y devuelve { total, likedByMe }.
export function escucharLikes(recipeId, uid, onData, onError) {
  return onSnapshot(
    collection(db, 'recipes', recipeId, 'likes'),
    (snap) => {
      onData({
        total: snap.size,
        likedByMe: uid ? snap.docs.some((d) => d.id === uid) : false,
      })
    },
    onError
  )
}

// Si ya dio like, lo quita; si no, lo agrega.
export async function toggleLike(recipeId, uid, yaLeDioLike) {
  const likeRef = doc(db, 'recipes', recipeId, 'likes', uid)
  if (yaLeDioLike) {
    await deleteDoc(likeRef)
  } else {
    await setDoc(likeRef, { createdAt: serverTimestamp() })
  }
}

// ---------------------------------------------------------------------------
// 5. Plan semanal (privado)  →  users/{uid}/mealPlan/{entryId}
// ---------------------------------------------------------------------------

export function agregarAlPlan(uid, entrada) {
  // entrada: { day: 'Lunes', type: 'Almuerzo', recipeId, title, notes }
  return addDoc(collection(db, 'users', uid, 'mealPlan'), {
    ...entrada,
    createdAt: serverTimestamp(),
  })
}

export function escucharPlan(uid, onData, onError) {
  const q = query(collection(db, 'users', uid, 'mealPlan'), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )
}

export function actualizarEntradaPlan(uid, entryId, cambios) {
  return setDoc(doc(db, 'users', uid, 'mealPlan', entryId), cambios, { merge: true })
}

export function eliminarDelPlan(uid, entryId) {
  return deleteDoc(doc(db, 'users', uid, 'mealPlan', entryId))
}
