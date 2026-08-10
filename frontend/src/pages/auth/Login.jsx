import { useState } from 'react'
import { required, email as emailValidator, composeValidators } from '../../utils/validation'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/common/Logo'
import FormField from '../../components/common/FormField'
import {useAuth} from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()

  const navigate = useNavigate()
  // State: stores what the user types in each field
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // state: stores the error message to display if login fails
  const [error, setError] = useState({
    email: "",
    password:""
  })

  const handleSubmit = async (e) => {

    e.preventDefault()

    setError({
      email: "",
      password: ""
    })
    

    //const emailError = composeValidators(required, emailValidator)(email)
    const emailError = required(email) || emailValidator(email)
    const passwordError = required(password)


    if (emailError || passwordError) {
      setError({ email: emailError, password: passwordError })
      return 
    }

    try {

        await login(email, password)

        navigate("/admin")

    }

    catch {

      alert("Utilisateur inconnu")

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
              className="btn-primary w-full mt-2">Se connecter</button>
          </form>
        </div>
      </div>
    </div>
  )
}

