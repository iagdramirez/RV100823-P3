import React, { useEffect, useState } from 'react'
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import { BookingState, getValidTransitions, stateDescriptions } from '../../lib/bookingStateTransitions'
import { useProfileContext } from '../contexts/ProfileContext'
import useAuth from '../hooks/useAuth'
import useBookings from '../hooks/useBookings'
import useServices from '../hooks/useServices'

interface BookingWithService {
  id: string
  id_cliente: string
  id_servicio: string
  fecha: string
  estado: string
  created_at: string
  servicio_titulo?: string
  servicio_categoria?: string
  servicio_precio?: number
  servicio_ubicacion?: string
}

const ServiciosContratadosScreen: React.FC = () => {
  const { user } = useAuth()
  const { userRole } = useProfileContext()
  const { bookings, loading, fetchBookings, updateBooking } = useBookings()
  const { services } = useServices()
  const [contratados, setContratados] = useState<BookingWithService[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (bookings.length > 0 && services.length > 0 && user?.id) {
      // Filtrar bookings válidos
      const validBookings = bookings.filter(booking => booking && booking.id_servicio)
      const filteredBookings = validBookings.filter(booking => {
        const servicio = services.find(s => s.id === booking.id_servicio)
        return servicio?.id_proveedor === user.id
      })
      const combined = filteredBookings.map(booking => {
        const servicio = services.find(s => s.id === booking.id_servicio)
        if (!servicio) {
          console.warn('No service found for booking:', booking.id_servicio)
          return null
        }
        return {
          ...booking,
          servicio_titulo: servicio.titulo || 'Servicio no encontrado',
          servicio_categoria: servicio.categoria || 'N/A',
          servicio_precio: servicio.precio || 0,
          servicio_ubicacion: servicio.ubicacion || 'N/A',
        }
      }).filter(Boolean) as BookingWithService[]
      setContratados(combined)
    } else {
      setContratados([])
    }
  }, [bookings, services, user])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBookings()
    setRefreshing(false)
  }

  const changeStatus = async (id: string, newStatus: string) => {
    console.log('Changing status for booking id:', id, 'to:', newStatus)
    if (!id) {
      Alert.alert('Error', 'ID de reserva inválido')
      return
    }
    const { data, error } = await updateBooking(id, { estado: newStatus })
    console.log('Update result - data:', data, 'error:', error)
    if (error) {
      console.error('Error updating booking:', error)
      Alert.alert('Error en la transición', error.message || 'No se pudo actualizar el estado.')
    } else {
      console.log('Booking updated successfully, refreshing...')
      Alert.alert('Éxito', `Estado cambiado a: ${getStatusText(newStatus)}`)
      // Refrescar bookings para sincronizar con la base de datos
      await fetchBookings()
    }
  }

  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return '#ffa500'
      case 'confirmada':
        return '#00d084'
      case 'en proceso':
        return '#00d084'
      case 'completada':
        return '#00d084'
      case 'cancelada':
        return '#dc3545'
      default:
        return '#a1a1aa'
    }
  }

  const getStatusText = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'Pendiente'
      case 'confirmada':
        return 'Confirmada'
      case 'en proceso':
        return 'En Proceso'
      case 'completada':
        return 'Completada'
      case 'cancelada':
        return 'Cancelada'
      default:
        return estado
    }
  }

  const getValidTransitionButtons = (currentState: string, bookingId: string) => {
    const validStates = getValidTransitions(currentState as BookingState)
    return validStates.map(state => (
      <TouchableOpacity
        key={state}
        className="flex-1 bg-gray-700 p-2 rounded-lg"
        onPress={() => changeStatus(bookingId, state)}
        disabled={!bookingId}
      >
        <Text className="text-center text-white">{getStatusText(state)}</Text>
      </TouchableOpacity>
    ))
  }

  if (userRole !== 'proveedor') {
    return (
      <View className="flex-1 bg-primary justify-center items-center px-5 pb-4 pt-16">
        <Text className="text-2xl font-semibold text-text mb-4">Acceso Denegado</Text>
        <Text className="text-textSecondary text-center">Esta sección es solo para proveedores.</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-primary px-5 pb-4 pt-16">
      <Text className="text-2xl font-semibold text-text mb-4">Servicios Contratados</Text>
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-textSecondary">Cargando...</Text>
        </View>
      ) : contratados.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-textSecondary text-lg mb-2">No tienes servicios contratados</Text>
          <Text className="text-textSecondary text-center">Los servicios que ofrezcas aparecerán aquí una vez que sean reservados.</Text>
        </View>
      ) : (
        <FlatList
          data={contratados}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View className="bg-secondary rounded-2xl p-4 mb-3 shadow-md">
              <Text className="text-text font-semibold text-lg mb-1">{item.servicio_titulo}</Text>
              <Text className="text-textSecondary text-sm mb-2">{item.servicio_categoria}</Text>
              <Text className="text-accent font-bold text-base mb-1">${item.servicio_precio}</Text>
              <Text className="text-textSecondary text-sm mb-2">{item.servicio_ubicacion}</Text>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-textSecondary text-sm">Fecha: {new Date(item.fecha).toLocaleDateString('es-ES')}</Text>
                <Text className="text-sm font-medium" style={{ color: getStatusColor(item.estado) }}>
                  {getStatusText(item.estado)}
                </Text>
              </View>
              <Text className="text-textSecondary text-xs mb-2">{stateDescriptions[item.estado as BookingState]}</Text>
              <View className="flex-row gap-2">
                {getValidTransitionButtons(item.estado, item.id)}
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

export default ServiciosContratadosScreen