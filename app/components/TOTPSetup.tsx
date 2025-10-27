import * as Clipboard from 'expo-clipboard'
import React, { useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import { OtpInput } from 'react-native-otp-entry'
import QRCode from 'react-native-qrcode-svg'
import { generateTOTPSecret, generateTOTPUrl, verifyTOTP } from '../../lib/totp'
import Button from './Button'

interface TOTPSetupProps {
  accountName: string
  onComplete: (secret: string) => void
  onCancel: () => void
}

const TOTPSetup: React.FC<TOTPSetupProps> = ({ accountName, onComplete, onCancel }) => {
  const [secret] = useState(generateTOTPSecret())
  const [otpCode, setOtpCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const totpUrl = generateTOTPUrl(secret, accountName)

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(secret)
    Alert.alert('Copiado', 'El secreto TOTP ha sido copiado al portapapeles')
  }

  const verifyCode = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos')
      return
    }

    setIsVerifying(true)
    const isValid = verifyTOTP(secret, otpCode)

    if (isValid) {
      onComplete(secret)
    } else {
      Alert.alert('Error', 'Código inválido. Inténtalo de nuevo.')
      setOtpCode('')
    }
    setIsVerifying(false)
  }

  return (
    <View className="p-4 bg-gray-800 rounded-2xl">
      <Text className="text-xl font-semibold text-text mb-4">Configurar Autenticación TOTP</Text>

      <Text className="text-text mb-2">Escanea el código QR con tu app de autenticación:</Text>
      <View className="items-center mb-4">
        <QRCode value={totpUrl} size={150} />
      </View>

      <Text className="text-text mb-2">O copia el secreto manualmente:</Text>
      <TouchableOpacity onPress={copyToClipboard} className="bg-gray-700 p-3 rounded-lg mb-4">
        <Text className="text-accent font-mono text-center">{secret}</Text>
        <Text className="text-text text-sm text-center mt-1">Toca para copiar</Text>
      </TouchableOpacity>

      <Text className="text-text mb-2">Ingresa el código de 6 dígitos de tu app:</Text>
      <OtpInput
        numberOfDigits={6}
        onTextChange={setOtpCode}
        theme={{
          containerStyle: { marginBottom: 20 },
          pinCodeContainerStyle: { backgroundColor: '#374151', borderColor: '#6B7280' },
          pinCodeTextStyle: { color: '#FFFFFF' },
          focusStickStyle: { backgroundColor: '#10B981' },
          focusedPinCodeContainerStyle: { borderColor: '#10B981' },
        }}
      />

      <View className="flex-row gap-2">
        <Button title="Verificar" onPress={verifyCode} disabled={isVerifying || otpCode.length !== 6} />
        <Button title="Cancelar" onPress={onCancel} variant="secondary" />
      </View>
    </View>
  )
}

export default TOTPSetup