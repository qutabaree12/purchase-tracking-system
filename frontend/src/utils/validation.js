export const required = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'Ce champ est requis'
  }
  return null
}

export const email = (value) => {
  if (!value) return null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(value) ? null : 'Email invalide'
}

export const minLength = (min) => (value) => {
  if (!value) return null
  return value.length >= min ? null : `Minimum ${min} caractères`
}

export const positiveNumber = (value) => {
  if (value === undefined || value === null) return null
  return value > 0 ? null : 'La valeur doit être positive'
}

export const composeValidators = (...validators) => {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return null
  }
}
