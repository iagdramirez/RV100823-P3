import React, { useEffect, useState } from 'react'
import { FlatList, RefreshControl, Text, View } from 'react-native'
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

const BookingsScreen: React.FC = () => {
  const { user } = useAuth()
  const { bookings, loading, fetchBookings } = useBookings()
  const { services } = useServices()
  const [bookingsWithServices, setBookingsWithServices] = useState<BookingWithService[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // Combinar reservas con información de servicios
  useEffect(() => {
    if (bookings.length > 0 && services.length > 0) {
      const combinedBookings = bookings.map(booking => {
        const servicio = services.find(s => s.id === booking.id_servicio)
        return {
          ...booking,
          servicio_titulo: servicio?.titulo || 'Servicio no encontrado',
          servicio_categoria: servicio?.categoria || 'N/A',
          servicio_precio: servicio?.precio || 0,
          servicio_ubicacion: servicio?.ubicacion || 'N/A',
        }
      })
      setBookingsWithServices(combinedBookings)
    } else {
      setBookingsWithServices([])
    }
  }, [bookings, services])

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBookings()
    setRefreshing(false)
  }

  // Función para obtener color según estado
  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return '#ffa500'
      case 'confirmada':
        return '#00d084'
      case 'completada':
        return '#00d084'
      case 'cancelada':
        return '#dc3545'
      default:
        return '#a1a1aa'
    }
  }

  // Función para obtener texto del estado en español
  const getStatusText = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'Pendiente'
      case 'confirmada':
        return 'Confirmada'
      case 'completada':
        return 'Completada'
      case 'cancelada':
        return 'Cancelada'
      default:
        return estado
    }
  }

  if (!user) {
    return (
      <View className="flex-1 bg-primary justify-center items-center px-5 pb-4 pt-16">
        <Text className="text-2xl font-semibold text-text mb-4">Mis Reservas</Text>
        <Text className="text-textSecondary text-center">Debes iniciar sesión para ver tus reservas</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-primary px-5 pb-4 pt-16">
      <Text className="text-2xl font-semibold text-text mb-4">Mis Reservas</Text>
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-textSecondary">Cargando reservas...</Text>
        </View>
      ) : bookingsWithServices.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-textSecondary text-lg mb-2">No tienes reservas aún</Text>
          <Text className="text-textSecondary text-center">¡Explora servicios y realiza tu primera reserva!</Text>
        </View>
      ) : (
        <FlatList
          data={bookingsWithServices}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View className="bg-secondary rounded-2xl p-4 mb-3 shadow-lg">
              <Text className="text-text font-semibold text-lg mb-1">{item.servicio_titulo}</Text>
              <Text className="text-textSecondary text-sm mb-2">{item.servicio_categoria}</Text>
              <Text className="text-accent font-bold text-base mb-1">${item.servicio_precio}</Text>
              <Text className="text-textSecondary text-sm mb-2">{item.servicio_ubicacion}</Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-textSecondary text-sm">Fecha: {new Date(item.fecha).toLocaleDateString('es-ES')}</Text>
                <Text className="text-sm font-medium" style={{ color: getStatusColor(item.estado) }}>
                  {getStatusText(item.estado)}
                </Text>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

export default BookingsScreen
