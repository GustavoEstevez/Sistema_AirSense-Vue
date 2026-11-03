export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

export function validatePassword(password) {
  if (String(password || '').length < 10) return 'La contraseña debe tener al menos 10 caracteres.'
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Incluí al menos una mayúscula, una minúscula y un número.'
  }
  return ''
}

export function validateName(value) {
  const clean = String(value || '').trim()
  return clean.length >= 2 && clean.length <= 80
}
