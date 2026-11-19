import { useEffect, useState } from 'react'
import { Trash2, Check } from 'lucide-react'
import {
  escucharPlan,
  agregarAlPlan,
  actualizarEntradaPlan,
  eliminarDelPlan,
} from '../firebase'
import { DIAS, MOMENTOS, mensajeError } from '../utils'

export default function PlannerView({ user, notify }) {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ day: DIAS[0], type: MOMENTOS[1], title: '' })
  const [errorTitulo, setErrorTitulo] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(
    () =>
      escucharPlan(
        user.uid,
        (lista) => {
          setItems(lista)
          setCargando(false)
        },
        (e) => {
          setError(mensajeError(e))
          setCargando(false)
        }
      ),
    [user.uid]
  )

  async function agregar(e) {
    e.preventDefault()
    if (form.title.trim().length < 2) {
      setErrorTitulo('Escribí qué vas a comer (mínimo 2 caracteres).')
      return
    }
    setErrorTitulo('')
    setGuardando(true)
    try {
      await agregarAlPlan(user.uid, {
        day: form.day,
        type: form.type,
        title: form.title.trim(),
        done: false,
      })
      setForm({ ...form, title: '' })
      notify('success', 'Comida agregada al plan')
    } catch (err) {
      notify('error', mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  async function marcar(item) {
    try {
      await actualizarEntradaPlan(user.uid, item.id, { done: !item.done })
    } catch (err) {
      notify('error', mensajeError(err))
    }
  }

  async function borrar(item) {
    try {
      await eliminarDelPlan(user.uid, item.id)
      notify('success', 'Comida eliminada del plan')
    } catch (err) {
      notify('error', mensajeError(err))
    }
  }

  const deDia = (dia) =>
    items
      .filter((i) => i.day === dia)
      .sort((a, b) => MOMENTOS.indexOf(a.type) - MOMENTOS.indexOf(b.type))

  return (
    <section>
      <form className="card form inline" onSubmit={agregar} noValidate>
        <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} aria-label="Día">
          {DIAS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} aria-label="Momento">
          {MOMENTOS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ej: Ensalada con pollo"
          aria-label="Comida"
        />
        <button className="btn primary" disabled={guardando}>
          {guardando ? 'Agregando…' : 'Agregar'}
        </button>
        {errorTitulo && <span className="field-error">{errorTitulo}</span>}
      </form>

      {cargando && <p className="state">Cargando tu semana…</p>}
      {error && <p className="field-error" role="alert">{error}</p>}

      <div className="week">
        {DIAS.map((dia) => (
          <div key={dia} className="card day">
            <h3>{dia}</h3>
            {deDia(dia).length === 0 && <p className="muted small">Sin comidas</p>}
            {deDia(dia).map((item) => (
              <div key={item.id} className={`entry ${item.done ? 'done' : ''}`}>
                <div>
                  <span className="chip">{item.type}</span>
                  <p>{item.title}</p>
                </div>
                <div className="entry-actions">
                  <button className="icon-btn" onClick={() => marcar(item)} aria-label="Marcar como hecha">
                    <Check size={16} />
                  </button>
                  <button className="icon-btn danger" onClick={() => borrar(item)} aria-label="Eliminar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
