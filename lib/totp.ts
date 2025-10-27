import CryptoJS from 'crypto-js'

// Función para generar un secreto aleatorio de 32 caracteres en base32
export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return secret
}

// Función para generar el código TOTP
export function generateTOTP(secret: string): string {
  const timeStep = 30 // 30 segundos
  const time = Math.floor(Date.now() / 1000 / timeStep)
  const timeHex = time.toString(16).padStart(16, '0')

  // Convertir secreto base32 a hex
  const secretHex = base32ToHex(secret)

  // Crear HMAC-SHA1
  const hmac = CryptoJS.HmacSHA1(CryptoJS.enc.Hex.parse(timeHex), CryptoJS.enc.Hex.parse(secretHex))
  const hmacHex = hmac.toString()

  // Obtener el offset
  const offset = parseInt(hmacHex.slice(-1), 16)

  // Extraer 4 bytes empezando desde el offset
  const code = parseInt(hmacHex.substr(offset * 2, 8), 16) & 0x7fffffff

  // Obtener los últimos 6 dígitos
  return (code % 1000000).toString().padStart(6, '0')
}

// Función para verificar el código TOTP
export function verifyTOTP(secret: string, code: string): boolean {
  const currentCode = generateTOTP(secret)
  return currentCode === code
}

// Función auxiliar para convertir base32 a hex
function base32ToHex(base32: string): string {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  let hex = ''

  for (let i = 0; i < base32.length; i++) {
    const val = base32Chars.indexOf(base32.charAt(i).toUpperCase())
    bits += val.toString(2).padStart(5, '0')
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substr(i, 4)
    hex += parseInt(chunk, 2).toString(16)
  }

  return hex
}

// Función para generar la URL del QR code
export function generateTOTPUrl(secret: string, accountName: string, issuer: string = 'Marketplace Services'): string {
  return `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
}