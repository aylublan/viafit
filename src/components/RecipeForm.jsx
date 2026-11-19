import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { crearReceta } from '../firebase'
import { Modal } from './ui.jsx'
import { CATEGORIAS, DIFICULTADES, comprimirImagen, mensajeError } from '../utils'

export default function RecipeForm({ user, notify, onClose }) {
  const [form, setForm] = useState({
    title: '',
    category: CATEGORIAS[0],
    time: '',
    difficulty: DIFICULTADES[0],
    servings: '',
    ingredients: '',
    steps: '',
  })
  const [imagen, setImagen] = useState('')
  const [errores, setErrores] = useState({})
  const [procesando, setProcesando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function elegirImagen(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setProcesando(true)
    setErrores((x) => ({ ...x, image: '' }))
    try {
      setImagen(await comprimirImagen(archivo))
    } catch (err) {
      setErrores((x) => ({ ...x, image: err.message }))
    } finally {
      setProcesando(false)
    }
  }

  async function enviar(e) {
    e.preventDefault()
    const nuevos = {}
    const tiempo = form.time === '' ? null : Number(form.time)
    const porciones = form.servings === '' ? null : Number(form.servings)
    if (form.title.trim().length < 3) nuevos.title = 'El nombre necesita al menos 3 caracteres.'
    if (!form.ingredients.trim()) nuevos.ingredients = 'Agregá al menos un ingrediente.'
    if (tiempo !== null && (!(tiempo >= 1) || tiempo > 999)) nuevos.time = 'Tiempo entre 1 y 999 minutos.'
    if (porciones !== null && (!(porciones >= 1) || porciones > 50)) nuevos.servings = 'Porciones entre 1 y 50.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setGuardando(true)
    try {
      await crearReceta(user, {
        title: form.title.trim(),
        category: form.category,
        difficulty: form.difficulty,
        time: tiempo,
        servings: porciones,
        ingredients: form.ingredients.trim(),
        steps: form.steps.trim(),
        image: imagen,
      })
      notify('success', 'Receta publicada')
      onClose()
    } catch (err) {
      notify('error', mensajeError(err))
      setGuardando(false)
    }
  }

  return (
    <Modal onClose={onClose} label="Nueva receta">
      <form className="sheet-form" onSubmit={enviar} noValidate>
        <div className="sheet-head">
          <h2>Nueva receta</h2>
          <button type="button" className="round" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <label className={`upload ${imagen ? 'has-img' : ''}`}>
          {imagen ? (
            <img src={imagen} alt="Vista previa" />
          ) : (
            <span>
              <ImagePlus size={28} />
              {procesando ? 'Procesando foto…' : 'Agregar foto'}
            </span>
          )}
          <input type="file" accept="image/*" onChange={elegirImagen} hidden />
        </label>
        {errores.image && <span className="field-error">{errores.image}</span>}

        <label>
          Nombre
          <input value={form.title} onChange={cambiar('title')} placeholder="Ej: Bowl de quinoa" />
          {errores.title && <span className="field-error">{errores.title}</span>}
        </label>

        <div className="row">
          <label>
            Categoría
            <select value={form.category} onChange={cambiar('category')}>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Dificultad
            <select value={form.difficulty} onChange={cambiar('difficulty')}>
              {DIFICULTADES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="row">
          <label>
            Tiempo (min)
            <input type="number" min="1" value={form.time} onChange={cambiar('time')} placeholder="30" />
            {errores.time && <span className="field-error">{errores.time}</span>}
          </label>
          <label>
            Porciones
            <input type="number" min="1" value={form.servings} onChange={cambiar('servings')} placeholder="4" />
            {errores.servings && <span className="field-error">{errores.servings}</span>}
          </label>
        </div>

        <label>
          Ingredientes
          <textarea rows={4} value={form.ingredients} onChange={cambiar('ingredients')} placeholder="Uno por línea" />
          {errores.ingredients && <span className="field-error">{errores.ingredients}</span>}
        </label>
        <label>
          Preparación
          <textarea rows={4} value={form.steps} onChange={cambiar('steps')} placeholder="Opcional" />
        </label>

        <button className="btn dark" disabled={guardando || procesando}>
          {guardando ? 'Publicando…' : 'Publicar receta'}
        </button>
      </form>
    </Modal>
  )
}
