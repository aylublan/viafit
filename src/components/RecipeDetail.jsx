import { useState } from 'react'
import { ArrowLeft, Clock, ChefHat, Users, Utensils, Trash2 } from 'lucide-react'
import { agregarAlPlan, eliminarReceta } from '../firebase'
import { Modal, LikeButton } from './ui.jsx'
import { DIAS, MOMENTOS, mensajeError } from '../utils'

export default function RecipeDetail({ receta, user, notify, onClose }) {
  const [dia, setDia] = useState(DIAS[0])
  const [momento, setMomento] = useState(MOMENTOS[1])
  const esMia = receta.authorId === user.uid
  const ingredientes = (receta.ingredients || '')
    .split('\n')
    .map((i) => i.trim())
    .filter(Boolean)

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
      onClose()
    } catch (e) {
      notify('error', mensajeError(e))
    }
  }

  return (
    <Modal onClose={onClose} label={receta.title}>
      <div className="detail-img">
        {receta.image ? (
          <img src={receta.image} alt={receta.title} />
        ) : (
          <div className="img-ph">
            <Utensils size={40} />
          </div>
        )}
        <button className="round back" onClick={onClose} aria-label="Cerrar">
          <ArrowLeft size={20} />
        </button>
        <LikeButton recipeId={receta.id} user={user} notify={notify} className="like-float" />
      </div>

      <div className="detail-body">
        <span className="chip">{receta.category}</span>
        <h2>{receta.title}</h2>
        <p className="muted small">por {receta.authorName}</p>

        <div className="stats">
          <div className="stat">
            <Clock size={18} />
            <span>Tiempo</span>
            <strong>{receta.time ? `${receta.time} min` : '—'}</strong>
          </div>
          <div className="stat">
            <ChefHat size={18} />
            <span>Dificultad</span>
            <strong>{receta.difficulty || '—'}</strong>
          </div>
          <div className="stat">
            <Users size={18} />
            <span>Porciones</span>
            <strong>{receta.servings ? `${receta.servings}` : '—'}</strong>
          </div>
        </div>

        <h3>Ingredientes ({ingredientes.length})</h3>
        <ul className="ingredients">
          {ingredientes.map((ing, i) => (
            <li key={i}>{ing}</li>
          ))}
        </ul>

        {receta.steps && (
          <>
            <h3>Preparación</h3>
            <p className="pre">{receta.steps}</p>
          </>
        )}

        <div className="plan-box">
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
          <button className="btn dark" onClick={alPlan}>
            Agregar a mi semana
          </button>
        </div>

        {esMia && (
          <button className="btn ghost danger-text" onClick={borrar}>
            <Trash2 size={16} /> Eliminar receta
          </button>
        )}
      </div>
    </Modal>
  )
}
