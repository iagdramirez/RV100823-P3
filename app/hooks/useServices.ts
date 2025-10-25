import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export interface Service {
  id: string
  id_proveedor: string
  titulo: string
  descripcion: string
  categoria: string
  precio: number
  ubicacion: string
  imagen_url: string
  created_at: string
}

const useServices = () => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('servicios').select('*')
    if (error) {
      console.error('Error fetching services:', error)
    } else {
      setServices(data || [])
    }
    setLoading(false)
  }

  const addService = async (service: Omit<Service, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('servicios').insert(service).select()
    if (error) {
      console.error('Error adding service:', error)
    } else {
      setServices([...services, data[0]])
    }
    return { data, error }
  }

  const updateService = async (id: string, updates: Partial<Service>) => {
    const { data, error } = await supabase.from('servicios').update(updates).eq('id', id).select()
    if (error) {
      console.error('Error updating service:', error)
    } else {
      setServices(services.map(s => (s.id === id ? data[0] : s)))
    }
    return { data, error }
  }

  const deleteService = async (id: string) => {
    const { error } = await supabase.from('servicios').delete().eq('id', id)
    if (error) {
      console.error('Error deleting service:', error)
    } else {
      setServices(services.filter(s => s.id !== id))
    }
    return { error }
  }

  return { services, loading, fetchServices, addService, updateService, deleteService }
}

export default useServices
