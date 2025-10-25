import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { Alert, RefreshControl, ScrollView, Text } from 'react-native'
import Button from '../components/Button'
import Input from '../components/Input'
import useAuth from '../hooks/useAuth'

const RegisterScreen: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const onRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000)
  }

  const { signUp } = useAuth()
  const navigation = useNavigation()

  const handleRegister = async () => {
    // Validar campos requeridos
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios')
      return
    }

    // Validar contraseñas
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden')
      return
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password)

      if (error) Alert.alert('Error', error.message)
      else {
        Alert.alert('Éxito', 'Cuenta creada correctamente. Revisa tu email para confirmar la cuenta.', [
          {
            text: 'OK',
            onPress: () => {
              // Resetear formulario
              setEmail('')
              setPassword('')
              setConfirmPassword('')
              // Navegar de vuelta al login
              navigation.goBack()
            },
          },
        ])
      }
    } catch {
      Alert.alert('Error', 'Error inesperado durante el registro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-primary px-5"
      contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-2xl font-semibold text-text text-center mb-5 mt-5">Crear Cuenta</Text>

      <Input placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      <Input placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChangeText={setPassword} secureTextEntry />

      <Input placeholder="Confirmar contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

      <Button title="Crear Cuenta" onPress={handleRegister} disabled={loading} />
    </ScrollView>
  )
}

export default RegisterScreen
