import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { escucharLikes, toggleLike } from '../firebase'
import { mensajeError } from '../utils'

// Ventana modal (en celular se comporta como una hoja desde abajo).
export function Modal({ onClose, label, children }) {
  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', alTeclear)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// Botón de like conectado a recipes/{id}/likes/{uid}.
export function LikeButton({ recipeId, user, notify, className = '' }) {
  const [likes, setLikes] = useState({ total: 0, likedByMe: false })

  useEffect(
    () => escucharLikes(recipeId, user.uid, setLikes, () => {}),
    [recipeId, user.uid]
  )

  async function alternar(e) {
    e.stopPropagation()
    try {
      await toggleLike(recipeId, user.uid, likes.likedByMe)
    } catch (err) {
      notify('error', mensajeError(err))
    }
  }

  return (
    <button
      className={`like ${likes.likedByMe ? 'on' : ''} ${className}`}
      onClick={alternar}
      aria-pressed={likes.likedByMe}
      aria-label="Me gusta"
    >
      <Heart size={18} fill={likes.likedByMe ? 'currentColor' : 'none'} /> {likes.total}
    </button>
  )
}
