import React, { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { OtpInput } from 'react-native-otp-entry'
import { verifyTOTP } from '../../lib/totp'
import Button from './Button'

interface TOTPVerificationProps {
  secret: string
  onSuccess: () => void
  onCancel: () => void
}

const TOTPVerification: React.FC<TOTPVerificationProps> = ({ secret, onSuccess, onCancel }) => {
  const [otpCode, setOtpCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const verifyCode = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos')
      return
    }

    setIsVerifying(true)
    const isValid = verifyTOTP(secret, otpCode)

    if (isValid) {
      onSuccess()
    } else {
      Alert.alert('Error', 'Código inválido. Inténtalo de nuevo.')
      setOtpCode('')
    }
    setIsVerifying(false)
  }

  return (
    <View className="p-4 bg-gray-800 rounded-2xl">
      <Text className="text-xl font-semibold text-text mb-4">Verificación de Dos Factores</Text>

      <Text className="text-text mb-4">
        Ingresa el código de 6 dígitos de tu aplicación de autenticación
      </Text>

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

export default TOTPVerification