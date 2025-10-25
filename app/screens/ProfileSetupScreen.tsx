import React, { useEffect, useState } from 'react'
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native'
import Button from '../components/Button'
import Input from '../components/Input'
import { useProfileContext } from '../contexts/ProfileContext'

const ProfileSetupScreen: React.FC = () => {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [userType, setUserType] = useState('cliente')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000)
  }

  const { profile, completeProfile, refreshProfile, triggerProfileUpdate } = useProfileContext()

  // Cargar datos existentes del perfil si los hay
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setUserType(profile.user_type || 'cliente')
    }
  }, [profile])

  const handleCompleteProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'El nombre completo es obligatorio')
      return
    }

    setLoading(true)

    try {
      const { error } = await completeProfile(fullName.trim(), phone.trim(), userType)

      if (error) {
        Alert.alert('Error', 'No se pudo guardar el perfil: ' + error.message)
      } else {
        console.log('Profile completed successfully, triggering multiple update mechanisms...')

        // Múltiples mecanismos de actualización para garantizar que funcione
        await refreshProfile()
        triggerProfileUpdate()

        // Trigger global como respaldo adicional
        if ((window as any).triggerProfileUpdate) {
          ;(window as any).triggerProfileUpdate()
        }

        console.log('All update mechanisms triggered, showing success dialog...')

        // Mostrar feedback de éxito con navegación automática
        Alert.alert(
          '¡Perfil Completado! 🎉',
          `Bienvenido${fullName.trim() ? ' ' + fullName.trim() : ''}! Ya puedes acceder a todas las funciones como ${
            userType === 'cliente' ? 'cliente' : 'proveedor'
          }.`,
          [
            {
              text: '¡Comenzar!',
              onPress: () => {
                console.log('Perfil completado exitosamente, navegación debería ser automática...')

                // Mecanismo de respaldo: verificar después de un delay si la navegación automática funcionó
                setTimeout(() => {
                  console.log('Verificando navegación automática después de 1 segundo...')
                  // Si aún estamos en esta pantalla después de 1 segundo, intentar navegación manual
                  // Nota: En una aplicación real, podrías usar navigation.replace() aquí como respaldo
                }, 1000)
              },
            },
          ],
        )
      }
    } catch {
      Alert.alert('Error', 'Error inesperado al guardar el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-primary px-5 pb-4 pt-16" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text className="text-2xl font-semibold text-text text-center mb-2">🎯 Completa tu Perfil</Text>
      <Text className="text-textSecondary text-base text-center mb-6 leading-5">
        Para brindarte la mejor experiencia, necesitamos algunos datos básicos.
      </Text>

      <View className="mb-6 px-2">
        <Text className="text-textSecondary text-xs text-center mb-2">Paso 1 de 1: Información básica</Text>
        <View className="h-1 bg-tertiary rounded-full overflow-hidden">
          <View className="h-full bg-accent rounded-full w-full" />
        </View>
      </View>

      <Input placeholder="Nombre completo *" value={fullName} onChangeText={setFullName} autoCapitalize="words" />

      <Input placeholder="Teléfono (opcional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text className="text-text font-semibold mb-3 mt-2">¿Cómo usarás la aplicación?</Text>
      <View className="flex-row justify-between mb-4">
        <Button
          title="Como Cliente"
          onPress={() => setUserType('cliente')}
          variant={userType === 'cliente' ? 'primary' : 'secondary'}
          style={{ flex: 0.48 }}
        />
        <Button
          title="Como Proveedor"
          onPress={() => setUserType('proveedor')}
          variant={userType === 'proveedor' ? 'primary' : 'secondary'}
          style={{ flex: 0.48 }}
        />
      </View>

      <Text className="text-textSecondary text-sm text-center mb-6 leading-5 italic">
        {userType === 'cliente' ? 'Podrás buscar y contratar servicios de profesionales.' : 'Podrás ofrecer tus servicios profesionales a clientes.'}
      </Text>

      <Button title={loading ? 'Guardando...' : 'Completar Perfil'} onPress={handleCompleteProfile} disabled={loading || !fullName.trim()} />

      {loading && <Text className="text-accent text-center mt-3 italic">⏳ Procesando tu información...</Text>}

      <Text className="text-textSecondary text-xs text-center mt-2">* Campos obligatorios</Text>
    </ScrollView>
  )
}

export default ProfileSetupScreen
