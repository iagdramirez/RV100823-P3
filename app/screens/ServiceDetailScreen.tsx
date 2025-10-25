import { useNavigation, useRoute } from '@react-navigation/native'
import React, { useState } from 'react'
import { Alert, Image, RefreshControl, ScrollView, Text, View } from 'react-native'
import Button from '../components/Button'
import useAuth from '../hooks/useAuth'
import useBookings from '../hooks/useBookings'
import { Service } from '../hooks/useServices'

interface RouteParams {
  service?: Service
}

const ServiceDetailScreen: React.FC = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { user } = useAuth()
  const { addBooking } = useBookings()
  const [bookingLoading, setBookingLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    // Since it's a detail view, just simulate refresh
    setTimeout(() => setRefreshing(false), 1000)
  }

  const { service } = (route.params as RouteParams) || {}

  const handleBooking = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para contratar servicios')
      return
    }

    setBookingLoading(true)
    try {
      if (!service) return

      const { error } = await addBooking({
        id_cliente: user.id,
        id_servicio: service.id,
        fecha: new Date().toISOString().split('T')[0],
        estado: 'pendiente',
      })

      if (error) {
        Alert.alert('Error', 'No se pudo crear la reserva: ' + error.message)
      } else {
        Alert.alert('Éxito', 'Servicio contratado correctamente')
        ;(navigation as any).navigate('Mis Reservas')
      }
    } catch {
      Alert.alert('Error', 'Error inesperado al crear la reserva')
    } finally {
      setBookingLoading(false)
    }
  }

  if (!service) {
    return (
      <View className="flex-1 bg-primary justify-center items-center px-5 pb-4 pt-16">
        <Text className="text-textSecondary text-lg mb-4 text-center">Servicio no encontrado</Text>
        <Button title="Volver" onPress={() => navigation.goBack()} />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-primary" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Image source={{ uri: service.imagen_url }} className="w-full h-64" resizeMode="cover" />
      <View className="p-4">
        <Text className="text-text text-2xl font-semibold mb-2">{service.titulo}</Text>
        <Text className="text-textSecondary text-base mb-2">{service.categoria}</Text>
        <Text className="text-accent text-xl font-bold mb-2">${service.precio}</Text>
        <Text className="text-textSecondary text-base mb-4">{service.ubicacion}</Text>
        <Text className="text-text text-base leading-6 mb-5">{service.descripcion}</Text>
        <Button title="Contratar Servicio" onPress={handleBooking} disabled={bookingLoading} />
      </View>
    </ScrollView>
  )
}

export default ServiceDetailScreen
