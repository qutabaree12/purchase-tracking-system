import { useState } from 'react'
import { required, email as emailValidator } from '../../utils/validation'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getRoleAccess } from '../../constants/roles'
import atLogo from '../../assets/images/logo.webp'

const NAVY = '#233C82'
const GREEN = '#009639'
const GREEN_DARK = '#007A2E'
const DEEP = '#1A2744'
const BORDER = '#E2E8F0'
const GRAY = '#8892A0'

function UserIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 text-[#8892A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState({ email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError({ email: '', password: '' })
    setSubmitError('')

    const emailError = required(email) || emailValidator(email)
    const passwordError = required(password)

    if (emailError || passwordError) {
      setError({ email: emailError, password: passwordError })
      return
    }

    setLoading(true)
    try {
      const userData = await login(email, password)
      navigate(getRoleAccess(userData.role).home)
    } catch (err) {
      const message = err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || 'Email ou mot de passe incorrect.'
      setSubmitError(Array.isArray(message) ? message[0] : message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 overflow-hidden" style={{ backgroundColor: DEEP }}>
      <div
        className="flex overflow-hidden"
        style={{
          width: 900,
          maxWidth: '100%',
          height: 550,
          maxHeight: 'calc(100vh - 32px)',
          borderRadius: 16,
          boxShadow: '0 25px 70px rgba(0,0,0,0.4)',
        }}
      >
        {/* ---------- Panneau gauche : identité ---------- */}
        <div
          className="relative hidden md:flex flex-1 flex-col overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0a1a3d, #132a5e 50%, #1c3f8f)' }}
        >
          {/* Halo circulaire haut-droite */}
          <div
            className="absolute rounded-full"
            style={{ width: 280, height: 280, background: 'rgba(255,255,255,0.08)', filter: 'blur(70px)', top: -80, right: -80 }}
          />

          {/* Bandes diagonales vertes (115°) */}
          <div
            className="absolute"
            style={{
              width: '150%', height: 56, background: '#1f9d55', opacity: 0.85,
              transform: 'rotate(-25deg)', top: '30%', left: '-20%',
            }}
          />
          <div
            className="absolute"
            style={{
              width: '150%', height: 12, background: '#4fc97a', opacity: 0.35,
              transform: 'rotate(-25deg)', top: '42%', left: '-20%',
            }}
          />

          {/* Chevrons bas-gauche */}
          <svg className="absolute bottom-10 left-6" width="70" height="34" viewBox="0 0 70 34" fill="none">
            <path d="M6 4 L35 30 L64 4" stroke="rgba(255,255,255,0.18)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 16 L35 30 L64 16" stroke="rgba(31,157,85,0.35)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* Bloc marque (haut-gauche) */}
          <div className="absolute top-6 left-6 z-10">
            <span className="text-white/85 text-[13px] font-semibold" style={{ letterSpacing: '0.3em' }}>
              ALGÉRIE TÉLÉCOM
            </span>
          </div>

          {/* Bloc titre (centré au milieu) */}
          <div className="flex-1 flex items-center px-8 z-10">
            <div>
              <h1 className="text-white text-[34px] font-extrabold leading-tight">
                Portail de gestion interne
              </h1>
              <p className="text-white/75 text-[15px] mt-3 max-w-[320px] leading-relaxed">
                Suivez vos demandes d'achat, vos bons de commande et l'ensemble du processus d'importation.
              </p>
            </div>
          </div>
        </div>

        {/* ---------- Panneau droit : formulaire ---------- */}
        <div
          className="flex flex-col flex-1"
          style={{ backgroundColor: '#FAFBFC', padding: '28px 56px', minWidth: 0 }}
        >
          {/* En-tête */}
          <div className="flex flex-col items-center text-center">
            <img src={atLogo} alt="Algérie Télécom" className="w-32 h-auto mb-3" />
            <h2 className="text-[26px] font-bold" style={{ color: GREEN, letterSpacing: '1px' }}>
              CONNEXION
            </h2>
            <p className="text-[13px] text-[#8892A0] mt-1">Accédez à votre portail interne</p>
          </div>

          {submitError && (
            <div className="mt-5 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
              {submitError}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <div
                className="bg-white rounded-[10px] transition-all focus-within:border-[#009639] focus-within:shadow-[0_2px_8px_rgba(0,150,57,0.08)]"
                style={{ position: 'relative', border: `1px solid ${BORDER}` }}
              >
                <div
                  style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 44,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#8892a0">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Identifiant employé"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '14px 14px 14px 48px',
                    border: 'none', outline: 'none', fontSize: 14,
                    background: 'transparent', color: NAVY, borderRadius: 10,
                  }}
                />
              </div>
              {error.email && <p className="text-xs text-red-600 mt-1 ml-1">{error.email}</p>}
            </div>

            <div>
              <div
                className="bg-white rounded-[10px] transition-all focus-within:border-[#009639] focus-within:shadow-[0_2px_8px_rgba(0,150,57,0.08)]"
                style={{ position: 'relative', border: `1px solid ${BORDER}` }}
              >
                <div
                  style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 44,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8892a0" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '14px 14px 14px 48px',
                    border: 'none', outline: 'none', fontSize: 14,
                    background: 'transparent', color: NAVY, borderRadius: 10,
                  }}
                />
              </div>
              {error.password && <p className="text-xs text-red-600 mt-1 ml-1">{error.password}</p>}
            </div>

            <div className="flex items-center justify-between pt-1">
              <a href="#" className="text-[12px] font-medium hover:text-[#007A2E] transition-colors" style={{ color: GREEN }}>
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})`,
                letterSpacing: '0.5px',
                borderRadius: 25,
                padding: '12px 38px',
                boxShadow: '0 4px 14px rgba(0,150,57,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,150,57,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,150,57,0.3)'
              }}
            >
              {loading ? 'Connexion...' : 'CONNEXION'}
            </button>
          </form>

          {/* Pied de page */}
          <p className="text-center text-[11px] mt-auto pt-6" style={{ color: GRAY }}>
            © 2026 Algérie Télécom — Portail Interne — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}
