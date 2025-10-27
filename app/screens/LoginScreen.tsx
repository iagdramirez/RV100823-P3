import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../lib/supabaseClient'
import Button from '../components/Button'
import Input from '../components/Input'
import TOTPVerification from '../components/TOTPVerification'
import useAuth from '../hooks/useAuth'

const icon = require('../../assets/images/icon.png')

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showTOTP, setShowTOTP] = useState(false)
  const [otpSecret, setOtpSecret] = useState('')
  const { signIn, loading } = useAuth()
  const navigation = useNavigation()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, ingresa email y contraseña')
      return
    }

    try {
      // Primero verificar si el usuario tiene TOTP activado
      const { data: profile, error: profileError } = await supabase.rpc('fn_get_profile_by_email', {
        p_email: email
      })

      if (profileError) {
        console.error('Error obteniendo perfil:', profileError)
        // Si hay error obteniendo perfil, continuar con login normal
        const { error } = await signIn(email, password)
        if (error) {
          Alert.alert('Error', error.message)
        }
        return
      }

      // Si el perfil existe y tiene otp_secret, mostrar verificación TOTP
      if (profile && profile.length > 0 && profile[0].otp_secret) {
        setOtpSecret(profile[0].otp_secret)
        setShowTOTP(true)
        return
      }

      // Si no tiene TOTP activado, proceder con login normal
      const { error } = await signIn(email, password)
      if (error) {
        Alert.alert('Error', error.message)
      }
    } catch (error) {
      console.error('Error en login:', error)
      Alert.alert('Error', 'Ocurrió un error inesperado')
    }
  }

  const handleTOTPSuccess = async () => {
    // Una vez verificado el TOTP, proceder con el signIn
    const { error } = await signIn(email, password)
    if (error) {
      Alert.alert('Error', error.message)
    }
    setShowTOTP(false)
  }

  const handleTOTPCancel = () => {
    setShowTOTP(false)
    setOtpSecret('')
  }

  const goToRegister = () => {
    navigation.navigate('Register' as never)
  }

  return (
    <View className="flex-1 bg-primary justify-center px-5">
      {/* @ts-ignore */}
      <Image source={icon} style={{ width: 80, height: 80, alignSelf: 'center', marginBottom: 20 }} />

      <Text className="text-2xl font-semibold text-text text-center mb-5">Iniciar Sesión</Text>

      {!showTOTP ? (
        <>
          <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Input placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

          <Button title="Iniciar Sesión" onPress={handleLogin} disabled={loading} />

          <TouchableOpacity onPress={goToRegister} className="mt-5 items-center">
            <Text className="text-textSecondary text-base text-center">
              ¿No tienes cuenta? <Text className="text-accent font-semibold">Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <TOTPVerification
          secret={otpSecret}
          onSuccess={handleTOTPSuccess}
          onCancel={handleTOTPCancel}
        />
      )}
    </View>
  )
}

export default LoginScreen
