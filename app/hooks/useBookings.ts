import { useEffect, useState } from 'react'
import { BookingState, validateStateChange } from '../../lib/bookingStateTransitions'
import { supabase } from '../../lib/supabaseClient'

export interface Booking {
  id: string
  id_cliente: string
  id_servicio: string
  fecha: string
  estado: string
  created_at: string
}

const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('reservas').select('*')
    if (error) {
      console.error('Error fetching bookings:', error)
      setBookings([])
    } else {
      // Filtrar elementos válidos
      const validBookings = (data || []).filter(booking => booking && booking.id && booking.id_servicio)
      setBookings(validBookings)
    }
    setLoading(false)
  }

  const addBooking = async (booking: Omit<Booking, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('reservas').insert(booking).select()
    if (error) {
      console.error('Error adding booking:', error)
    } else if (data && data[0]) {
      setBookings([...bookings, data[0]])
    }
    return { data, error }
  }

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    if (!id) {
      console.error('Invalid booking id:', id)
      return { data: null, error: new Error('ID de reserva inválido') }
    }

    // Obtener el estado actual de la reserva
    const currentBooking = bookings.find(b => b.id === id)
    if (!currentBooking) {
      console.error('Booking not found in local state:', id)
      return { data: null, error: new Error('Reserva no encontrada') }
    }

    // Si se está actualizando el estado, validar la transición
    if (updates.estado && updates.estado !== currentBooking.estado) {
      const validation = validateStateChange(currentBooking.estado as BookingState, updates.estado as BookingState)
      if (!validation.valid) {
        console.error('Invalid state transition:', validation.error)
        return { data: null, error: new Error(validation.error || 'Transición de estado inválida') }
      }
    }

    console.log('Updating booking with id:', id, 'updates:', updates)
    const { data, error } = await supabase.from('reservas').update(updates).eq('id', id).select()
    console.log('Supabase update result - data:', data, 'error:', error)
    if (error) {
      console.error('Error updating booking:', error)
      return { data, error }
    } else if (data && data[0]) {
      // Solo actualizar el estado local si la actualización fue exitosa
      setBookings(bookings.map(b => (b.id === id ? data[0] : b)))
      console.log('Booking updated successfully:', data[0])
    } else {
      console.warn('No data returned after update for id:', id, 'This might mean the id does not exist in the database')
    }
    return { data, error }
  }

  const deleteBooking = async (id: string) => {
    const { error } = await supabase.from('reservas').delete().eq('id', id)
    if (error) {
      console.error('Error deleting booking:', error)
    } else {
      setBookings(bookings.filter(b => b.id !== id))
    }
    return { error }
  }

  return { bookings, loading, fetchBookings, addBooking, updateBooking, deleteBooking }
}

export default useBookings
