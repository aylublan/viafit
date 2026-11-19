import { useEffect, useState } from 'react'
import { Heart, Trash2, CalendarPlus } from 'lucide-react'
import {
  crearReceta,
  escucharRecetas,
  eliminarReceta,
  escucharLikes,
  toggleLike,
  agregarAlPlan,
} from '../firebase'
import { DIAS, MOMENTOS, CATEGORIAS, mensajeError } from '../utils'

function RecipeForm({ user, notify }) {
  const vacio = { title: '', category: CATEGORIAS[0], ingredients: '', steps: '' }
  const [form, setForm] = useState(vacio)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function enviar(e) {
    e.preventDefault()
    const nuevos = {}
    if (form.title.trim().length < 3) nuevos.title = 'El nombre necesita al menos 3 caracteres.'
    if (!form.ingredients.trim()) nuevos.ingredients = 'Agregá al menos un ingrediente.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setGuardando(true)
    try {
      await crearReceta(user, {
        title: form.title.trim(),
        category: form.category,
        ingredients: form.ingredients.trim(),
        steps: form.steps.trim(),
      })
      setForm(vacio)
      notify('success', 'Receta publicada')
    } catch (err) {
      notify('error', mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="card form" onSubmit={enviar} noValidate>
      <h2>Nueva receta</h2>
      <label>
        Nombre
        <input value={form.title} onChange={cambiar('title')} placeholder="Ej: Bowl de quinoa" />
        {errores.title && <span className="field-error">{errores.title}</span>}
      </label>
      <label>
        Categoría
        <select value={form.category} onChange={cambiar('category')}>
          {CATEGORIAS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Ingredientes
        <textarea rows={3} value={form.ingredients} onChange={cambiar('ingredients')} placeholder="Uno por línea" />
        {errores.ingredients && <span className="field-error">{errores.ingredients}</span>}
      </label>
      <label>
        Preparación
        <textarea rows={3} value={form.steps} onChange={cambiar('steps')} placeholder="Opcional" />
      </label>
      <button className="btn primary" disabled={guardando}>
        {guardando ? 'Publicando…' : 'Publicar receta'}
      </button>
    </form>
  )
}

function RecipeCard({ receta, user, notify }) {
  const [likes, setLikes] = useState({ total: 0, likedByMe: false })
  const [dia, setDia] = useState(DIAS[0])
  const [momento, setMomento] = useState(MOMENTOS[1])
  const esMia = receta.authorId === user.uid

  useEffect(
    () => escucharLikes(receta.id, user.uid, setLikes, () => {}),
    [receta.id, user.uid]
  )

  async function like() {
    try {
      await toggleLike(receta.id, user.uid, likes.likedByMe)
    } catch (e) {
      notify('error', mensajeError(e))
    }
  }

  async function alPlan() {
    try {
      await agregarAlPlan(user.uid, {
        day: dia,
        type: momento,
        recipeId: receta.id,
        title: receta.title,
        done: false,
      })
      notify('success', `Agregada: ${dia}, ${momento.toLowerCase()}`)
    } catch (e) {
      notify('error', mensajeError(e))
    }
  }

  async function borrar() {
    if (!window.confirm('¿Eliminar esta receta?')) return
    try {
      await eliminarReceta(receta.id)
      notify('success', 'Receta eliminada')
    } catch (e) {
      notify('error', mensajeError(e))
    }
  }

  return (
    <article className="card recipe">
      <div className="recipe-head">
        <span className="chip">{receta.category}</span>
        <button
          className={`like ${likes.likedByMe ? 'on' : ''}`}
          onClick={like}
          aria-pressed={likes.likedByMe}
          aria-label="Me gusta"
        >
          <Heart size={18} fill={likes.likedByMe ? 'currentColor' : 'none'} /> {likes.total}
        </button>
      </div>
      <h3>{receta.title}</h3>
      <p className="muted small">por {receta.authorName}</p>
      <p className="pre">{receta.ingredients}</p>
      {receta.steps && <p className="pre muted">{receta.steps}</p>}

      <div className="actions">
        <select value={dia} onChange={(e) => setDia(e.target.value)} aria-label="Día">
          {DIAS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select value={momento} onChange={(e) => setMomento(e.target.value)} aria-label="Momento">
          {MOMENTOS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <button className="btn ghost" onClick={alPlan}>
          <CalendarPlus size={16} /> Al plan
        </button>
        {esMia && (
          <button className="icon-btn danger" onClick={borrar} aria-label="Eliminar receta">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </article>
  )
}

export default function RecipesView({ user, notify }) {
  const [recetas, setRecetas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(
    () =>
      escucharRecetas(
        (lista) => {
          setRecetas(lista)
          setCargando(false)
        },
        (e) => {
          setError(mensajeError(e))
          setCargando(false)
        }
      ),
    []
  )

  return (
    <section className="two-col">
      <RecipeForm user={user} notify={notify} />
      <div>
        {cargando && <p className="state">Cargando recetas…</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
        {!cargando && !error && recetas.length === 0 && (
          <p className="state">Todavía no hay recetas. ¡Publicá la primera!</p>
        )}
        <div className="grid">
          {recetas.map((r) => (
            <RecipeCard key={r.id} receta={r} user={user} notify={notify} />
          ))}
        </div>
      </div>
    </section>
  )
}
