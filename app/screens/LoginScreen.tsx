import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native'
import Button from '../components/Button'
import Input from '../components/Input'
import useAuth from '../hooks/useAuth'

const icon = require('../../assets/images/icon.png')

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, loading } = useAuth()
  const navigation = useNavigation()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, ingresa email y contraseña')
      return
    }
    const { error } = await signIn(email, password)
    if (error) {
      Alert.alert('Error', error.message)
    }
  }

  const goToRegister = () => {
    navigation.navigate('Register' as never)
  }

  return (
    <View className="flex-1 bg-primary justify-center px-5">
      {/* @ts-ignore */}
      <Image source={icon} style={{ width: 80, height: 80, alignSelf: 'center', marginBottom: 20 }} />

      <Text className="text-2xl font-semibold text-text text-center mb-5">Iniciar Sesión</Text>

      <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      <Input placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      
      <Button title="Iniciar Sesión" onPress={handleLogin} disabled={loading} />

      <TouchableOpacity onPress={goToRegister} className="mt-5 items-center">
        <Text className="text-textSecondary text-base text-center">
          ¿No tienes cuenta? <Text className="text-accent font-semibold">Regístrate aquí</Text>
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default LoginScreen
