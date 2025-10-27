import React, { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { supabase } from '../../lib/supabaseClient'
import Button from '../components/Button'
import Input from '../components/Input'
import TOTPSetup from '../components/TOTPSetup'
import useAuth from '../hooks/useAuth'

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [userType, setUserType] = useState('cliente')
  const [otpSecret, setOtpSecret] = useState<string | null>(null)
  const [isTOTPSetupVisible, setIsTOTPSetupVisible] = useState(false)

  const fetchProfile = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
    if (error) {
      console.error('Error fetching profile:', error)
    } else {
      setFullName(data.full_name || '')
      setPhone(data.phone || '')
      setUserType(data.user_type || 'cliente')
      setOtpSecret(data.otp_secret || null)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchProfile()
  }, [user, fetchProfile])

  const updateProfile = async () => {
    if (!user) return
    // Validar que userType sea 'cliente' o 'proveedor'
    if (userType !== 'cliente' && userType !== 'proveedor') {
      Alert.alert('Error', 'Tipo de usuario inválido. Debe ser "cliente" o "proveedor".')
      return
    }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      phone,
      user_type: userType,
    })
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Éxito', 'Perfil actualizado')
    }
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      Alert.alert('Error', error.message)
    }
  }

  const handleTOTPSetupComplete = async (secret: string) => {
    if (!user) return
    const { error } = await supabase.from('profiles').update({ otp_secret: secret }).eq('id', user.id)
    if (error) {
      Alert.alert('Error', 'No se pudo guardar el secreto TOTP')
    } else {
      setOtpSecret(secret)
      setIsTOTPSetupVisible(false)
      Alert.alert('Éxito', 'Autenticación TOTP activada correctamente')
    }
  }

  const handleDisableTOTP = async () => {
    if (!user) return
    Alert.alert(
      'Desactivar TOTP',
      '¿Estás seguro de que quieres desactivar la autenticación TOTP?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('profiles').update({ otp_secret: null }).eq('id', user.id)
            if (error) {
              Alert.alert('Error', 'No se pudo desactivar TOTP')
            } else {
              setOtpSecret(null)
              Alert.alert('Éxito', 'Autenticación TOTP desactivada')
            }
          },
        },
      ]
    )
  }

  return (
    <View className="flex-1 bg-primary px-5 pb-4 pt-16">
      <ScrollView className="flex-1">
        <Text className="text-2xl font-semibold text-text mb-4">Perfil</Text>
        <Input placeholder="Nombre Completo" value={fullName} onChangeText={setFullName} />
        <Input placeholder="Teléfono" value={phone} onChangeText={setPhone} />
        <View className="mb-4 p-4 bg-gray-800 rounded-2xl shadow-md">
          <Text className="text-text mb-2">Rol de Usuario</Text>
          <Text className="text-accent font-semibold">{userType === 'cliente' ? 'Cliente' : 'Proveedor'}</Text>
        </View>

        <View className="mb-4 p-4 bg-gray-800 rounded-2xl shadow-md">
          <Text className="text-text mb-2">Autenticación de Dos Factores (TOTP)</Text>
          {otpSecret ? (
            <View>
              <Text className="text-green-400 mb-2">✓ Activada</Text>
              <Button title="Desactivar TOTP" onPress={handleDisableTOTP} variant="secondary" />
            </View>
          ) : (
            <View>
              <Text className="text-red-400 mb-2">✗ No activada</Text>
              {isTOTPSetupVisible ? (
                <TOTPSetup
                  accountName={fullName || user?.email || 'Usuario'}
                  onComplete={handleTOTPSetupComplete}
                  onCancel={() => setIsTOTPSetupVisible(false)}
                />
              ) : (
                <Button title="Activar TOTP" onPress={() => setIsTOTPSetupVisible(true)} />
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <View className="mt-4 gap-y-3">
        <Button title="Actualizar Perfil" onPress={updateProfile} />
        <Button title="Cerrar Sesión" onPress={handleSignOut} variant="secondary" />
      </View>
    </View>
  )
}

export default ProfileScreen
