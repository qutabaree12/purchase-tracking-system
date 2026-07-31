import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../../components/common/Logo'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-primary-600 text-white text-center py-2 text-sm">
        Système de Suivi des Achats
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <Logo className="h-14 w-auto" />
            </div>
            <h1 className="text-2xl font-[Oswald] font-medium text-primary-600">Connexion</h1>
            <p className="text-brand-text mt-1 text-sm">Accédez à votre espace</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full">Se connecter</button>
          </form>
        </div>
      </div>
    </div>
  )
}
