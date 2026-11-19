import { useEffect, useMemo, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, writeBatch,
} from 'firebase/firestore'
import { Check, Plus, Trash2, ShoppingBasket } from 'lucide-react'

const CATEGORIES = ['Verduras y frutas', 'Lácteos y huevos', 'Proteínas', 'Despensa', 'Otros']

const STARTER = [
  ['Pechuga de pollo', 'Proteínas'], ['Huevos', 'Lácteos y huevos'], ['Yogur griego', 'Lácteos y huevos'],
  ['Quinoa', 'Despensa'], ['Arroz integral', 'Despensa'], ['Avena', 'Despensa'],
  ['Bananas', 'Verduras y frutas'], ['Hojas verdes', 'Verduras y frutas'], ['Brócoli', 'Verduras y frutas'],
  ['Morrones', 'Verduras y frutas'], ['Batatas', 'Verduras y frutas'], ['Almendras', 'Despensa'],
  ['Garbanzos', 'Despensa'], ['Lentejas', 'Despensa'], ['Tomates', 'Verduras y frutas'], ['Palta', 'Verduras y frutas'],
]

export default function GroceryList({ user }) {
  const db = getFirestore()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('Todo')
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const col = useMemo(() => collection(db, 'users', user.uid, 'groceries'), [db, user.uid])

  useEffect(() => {
    const q = query(col, orderBy('createdAt', 'asc'))
    return onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => setError('No se pudo leer la lista: ' + e.message),
    )
  }, [col])

  async function addItem(e) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return
    setBusy(true)
    setError('')
    try {
      await addDoc(col, {
        name: clean,
        qty: qty.trim(),
        category,
        image: '',
        done: false,
        createdAt: serverTimestamp(),
      })
      setName('')
      setQty('')
    } catch (err) {
      setError('No se pudo agregar: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  async function loadStarter() {
    setBusy(true)
    setError('')
    try {
      const batch = writeBatch(db)
      STARTER.forEach(([n, c]) => {
        batch.set(doc(col), {
          name: n,
          qty: '',
          category: c,
          image: '',
          done: false,
          createdAt: serverTimestamp(),
        })
      })
      await batch.commit()
    } catch (err) {
      setError('No se pudo cargar la lista base: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  async function clearDone() {
    const done = items.filter((i) => i.done)
    if (!done.length) return
    const batch = writeBatch(db)
    done.forEach((i) => batch.delete(doc(col, i.id)))
    await batch.commit()
  }

  const toggle = (i) => updateDoc(doc(col, i.id), { done: !i.done })
  const remove = (i) => deleteDoc(doc(col, i.id))

  const doneCount = items.filter((i) => i.done).length
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0
  const visible = filter === 'Todo' ? items : items.filter((i) => i.category === filter)
  const groups = CATEGORIES.map((c) => [c, visible.filter((i) => i.category === c)]).filter(([, l]) => l.length)

  return (
    <section className="vf-grocery">
      <div className="vf-progress" aria-label={`${doneCount} de ${items.length} comprados`}>
        <div className="vf-progress-text">
          <strong>{doneCount} de {items.length}</strong> comprados
        </div>
        <div className="vf-bar"><span style={{ width: pct + '%' }} /></div>
        {doneCount > 0 && (
          <button type="button" className="vf-link" onClick={clearDone}>Borrar los tildados</button>
        )}
      </div>

      <div className="vf-chips" role="tablist">
        {['Todo', ...CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={filter === c}
            className={`vf-chip${filter === c ? ' is-on' : ''}`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <form className="vf-add" onSubmit={addItem}>
        <div className="vf-add-fields">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="¿Qué tenés que comprar?"
            aria-label="Producto"
          />
          <div className="vf-add-row">
            <input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Cantidad (ej. 2 kg)"
              aria-label="Cantidad"
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoría">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="vf-btn" disabled={busy || !name.trim()}>
              <Plus size={16} /> Agregar
            </button>
          </div>
        </div>
      </form>

      {error && <p className="vf-error">{error}</p>}

      {items.length === 0 && (
        <div className="vf-empty">
          <ShoppingBasket size={28} />
          <p>Tu lista está vacía. Agregá productos o empezá con la lista base.</p>
          <button type="button" className="vf-btn vf-btn-ghost" onClick={loadStarter} disabled={busy}>
            Cargar lista base
          </button>
        </div>
      )}

      {groups.map(([cat, list]) => (
        <div key={cat} className="vf-group">
          <h3>{cat}</h3>
          <ul>
            {list.map((i) => (
              <li key={i.id} className={i.done ? 'is-done' : ''}>
                <button
                  type="button"
                  className="vf-check"
                  onClick={() => toggle(i)}
                  aria-pressed={i.done}
                  aria-label={`Marcar ${i.name}`}
                >
                  {i.done && <Check size={14} />}
                </button>
                <div className="vf-thumb">
                  {i.image ? <img src={i.image} alt="" /> : <span>{i.name.charAt(0).toUpperCase()}</span>}
                </div>
                <span className="vf-item-name">{i.name}</span>
                {i.qty && <span className="vf-item-qty">{i.qty}</span>}
                <button
                  type="button"
                  className="vf-icon"
                  onClick={() => remove(i)}
                  aria-label={`Eliminar ${i.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
