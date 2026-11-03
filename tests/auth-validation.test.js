import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidEmail, validateName, validatePassword } from '../src/lib/authValidation.js'

test('accepts a strong password', () => {
  assert.equal(validatePassword('AirSense2026'), '')
})

test('rejects short and weak passwords', () => {
  assert.match(validatePassword('Aa1'), /10 caracteres/)
  assert.match(validatePassword('airsenseairsense'), /mayúscula/)
  assert.match(validatePassword('AIRSENSE2026'), /minúscula/)
  assert.match(validatePassword('AirSenseSegura'), /número/)
})

test('validates email syntax without exposing account state', () => {
  assert.equal(isValidEmail('persona@empresa.com'), true)
  assert.equal(isValidEmail('correo-invalido'), false)
})

test('validates profile name lengths', () => {
  assert.equal(validateName('Ana'), true)
  assert.equal(validateName(' A '), false)
  assert.equal(validateName('x'.repeat(81)), false)
})
