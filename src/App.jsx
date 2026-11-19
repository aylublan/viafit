import { useEffect, useState, useCallback } from 'react'
import { Leaf, LogOut } from 'lucide-react'
import { escucharSesion, loginConGoogle, cerrarSesion } from './firebase'
import RecipesView from './components/RecipesView.jsx'
import PlannerView from './components/PlannerView.jsx'

function mensajeLogin(error) {
  switch (error?.code) {
    case 'auth/popup-closed-by-user':
      return 'Cerraste la ventana de Google antes de terminar.'
    case 'auth/unauthorized-domain':
      return 'Este dominio no está autorizado en Firebase (Authentication → Settings → Authorized domains).'
    case 'auth/operation-not-allowed':
      return 'Falta activar Google en Firebase → Authentication → Sign-in method.'
    default:
      return 'No se pudo iniciar sesión. Probá de nuevo.'
  }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [listo, setListo] = useState(false)
  const [tab, setTab] = useState('recetas')
  const [toast, setToast] = useState(null)
  const [errorLogin, setErrorLogin] = useState('')
  const [entrando, setEntrando] = useState(false)

  useEffect(
    () =>
      escucharSesion((u) => {
        setUser(u)
        setListo(true)
      }),
    []
  )

  const notify = useCallback((type, text) => {
    const id = Date.now()
    setToast({ id, type, text })
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 3500)
  }, [])

  async function entrar() {
    setErrorLogin('')
    setEntrando(true)
    try {
      await loginConGoogle()
    } catch (e) {
      if (e?.code !== 'auth/cancelled-popup-request') setErrorLogin(mensajeLogin(e))
    } finally {
      setEntrando(false)
    }
  }

  if (!listo) return <p className="state center-screen">Cargando…</p>

  if (!user) {
    return (
      <main className="login">
        <div className="card login-card">
          <div className="brand">
            <Leaf size={28} /> ViaFit
          </div>
          <h1>Organizá tu semana de comidas</h1>
          <p className="muted">Planificá tus comidas, publicá recetas y likeá las de otras personas.</p>
          <button className="btn primary" onClick={entrar} disabled={entrando}>
            {entrando ? 'Abriendo Google…' : 'Entrar con Google'}
          </button>
          {errorLogin && <p className="field-error" role="alert">{errorLogin}</p>}
        </div>
      </main>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Leaf size={26} /> ViaFit
        </div>
        <div className="user">
          {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
          <span>{user.displayName}</span>
          <button className="btn ghost" onClick={cerrarSesion}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button className={`tab ${tab === 'recetas' ? 'active' : ''}`} onClick={() => setTab('recetas')}>
          Recetas
        </button>
        <button className={`tab ${tab === 'plan' ? 'active' : ''}`} onClick={() => setTab('plan')}>
          Mi semana
        </button>
      </nav>

      {tab === 'recetas' ? (
        <RecipesView user={user} notify={notify} />
      ) : (
        <PlannerView user={user} notify={notify} />
      )}

      {toast && (
        <div className={`toast ${toast.type}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      )}
    </div>
  )
}
