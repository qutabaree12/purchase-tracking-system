import { useState } from 'react'
import { required, email as emailValidator, composeValidators } from '../../utils/validation'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getRoleAccess } from '../../constants/roles'
import Logo from '../../components/common/Logo'
import FormField from '../../components/common/FormField'


export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  // State: stores what the user types in each field
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  // state: stores the error message to display if login fails
  const [error, setError] = useState({
    email: "",
    password:""
  })

  const handleSubmit = async (e) => {

    e.preventDefault()

    setError({ email: "", password: "" })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-200 flex flex-col">
      <div className="bg-[#1d2d62] text-white text-center py-3 text-sm tracking-wide shadow-md">
        Système de Suivi des Achats
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-10 transition-all duration-300 hover:-translate-y-1">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-3">
              <Logo className="h-24 w-auto" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1d2d62]">
            Connexion</h1>
            <p className="text-gray-500 mt-3 text-sm">
            Accédez à votre espace sécurisé</p>
          </div>
          {submitError && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
              {submitError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
              <FormField
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                error={error.email}
              />

              <FormField
                label="Mot de passe"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                error={error.password}
              />
            <button type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2">{loading ? 'Connexion...' : 'Se connecter'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

