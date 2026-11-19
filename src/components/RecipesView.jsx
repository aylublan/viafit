import { useEffect, useState } from 'react'
import { Search, Plus, Clock, Utensils } from 'lucide-react'
import { escucharRecetas } from '../firebase'
import { LikeButton } from './ui.jsx'
import RecipeForm from './RecipeForm.jsx'
import RecipeDetail from './RecipeDetail.jsx'
import { CATEGORIAS, mensajeError } from '../utils'

const FILTROS = ['Todas', ...CATEGORIAS, 'Mis recetas']

function RecipeCard({ receta, user, notify, onOpen }) {
  return (
    <article
      className="rcard"
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <div className="rcard-img">
        {receta.image ? (
          <img src={receta.image} alt={receta.title} loading="lazy" />
        ) : (
          <div className="img-ph">
            <Utensils size={28} />
          </div>
        )}
        <span className="chip floating">{receta.category}</span>
      </div>
      <div className="rcard-body">
        <h3>{receta.title}</h3>
        <p className="muted small">por {receta.authorName}</p>
      </div>
      <footer className="rcard-foot">
        <span className="meta">
          <Clock size={15} /> {receta.time ? `${receta.time} min` : '—'}
        </span>
        <LikeButton recipeId={receta.id} user={user} notify={notify} />
      </footer>
    </article>
  )
}

export default function RecipesView({ user, notify }) {
  const [recetas, setRecetas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('Todas')
  const [abiertaId, setAbiertaId] = useState(null)
  const [creando, setCreando] = useState(false)

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

  const texto = busqueda.trim().toLowerCase()
  const visibles = recetas.filter((r) => {
    const coincide =
      !texto ||
      (r.title || '').toLowerCase().includes(texto) ||
      (r.ingredients || '').toLowerCase().includes(texto)
    const enFiltro =
      filtro === 'Todas' ||
      (filtro === 'Mis recetas' ? r.authorId === user.uid : r.category === filtro)
    return coincide && enFiltro
  })
  const abierta = recetas.find((r) => r.id === abiertaId)

  return (
    <section>
      <div className="hero">
        <h1>Explorá recetas</h1>
        <p className="muted">Inspirate, guardá tus favoritas y armá tu semana.</p>
        <div className="search">
          <Search size={18} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o ingrediente"
            aria-label="Buscar recetas"
          />
        </div>
        <button className="btn dark" onClick={() => setCreando(true)}>
          <Plus size={18} /> Nueva receta
        </button>
      </div>

      <div className="filters" role="tablist" aria-label="Filtrar por categoría">
        {FILTROS.map((f) => (
          <button
            key={f}
            className={`pill ${filtro === f ? 'active' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {!cargando && !error && (
        <p className="muted small count">
          {visibles.length} {visibles.length === 1 ? 'receta' : 'recetas'} para explorar
        </p>
      )}
      {cargando && <p className="state">Cargando recetas…</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      {!cargando && !error && visibles.length === 0 && (
        <p className="state">
          {recetas.length === 0
            ? 'Todavía no hay recetas. ¡Publicá la primera!'
            : 'No hay recetas que coincidan con tu búsqueda.'}
        </p>
      )}

      <div className="grid-rec">
        {visibles.map((r) => (
          <RecipeCard key={r.id} receta={r} user={user} notify={notify} onOpen={() => setAbiertaId(r.id)} />
        ))}
      </div>

      {creando && <RecipeForm user={user} notify={notify} onClose={() => setCreando(false)} />}
      {abierta && (
        <RecipeDetail receta={abierta} user={user} notify={notify} onClose={() => setAbiertaId(null)} />
      )}
    </section>
  )
}
