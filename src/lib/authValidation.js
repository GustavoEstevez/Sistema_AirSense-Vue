export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

export function validatePassword(password) {
  if (String(password || '').length < 12) return 'La contraseña debe tener al menos 12 caracteres.'
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Incluí al menos una mayúscula, una minúscula, un número y un símbolo.'
  }
  return ''
}

export function validateName(value) {
  const clean = String(value || '').trim()
  return clean.length >= 2 && clean.length <= 80
}
