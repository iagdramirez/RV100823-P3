import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import useAuth from './useAuth'

export interface Profile {
  id: string
  full_name: string
  phone: string
  user_type: string
  created_at: string
  updated_at: string
}

const useProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProfileComplete, setIsProfileComplete] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setIsProfileComplete(false)
      setLoading(false)
      return
    }

    setLoading(true)
    console.log('Fetching profile for user:', user.id)

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    if (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
      setIsProfileComplete(false)
    } else {
      console.log('Profile fetched successfully:', data)
      setProfile(data)
      // Consideramos el perfil completo si tiene nombre y tipo de usuario
      const complete = !!(data?.full_name && data?.user_type)
      setIsProfileComplete(complete)
      console.log('Profile complete status:', complete)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) {
      fetchProfile()

      // Suscribirse a cambios en la tabla profiles
      const subscription = supabase
        .channel(`profile_changes_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          payload => {
            console.log('Profile updated:', payload)
            fetchProfile() // Recargar perfil cuando cambie
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } else {
      setProfile(null)
      setIsProfileComplete(false)
      setLoading(false)
    }
  }, [user, fetchProfile])

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Usuario no autenticado') }

    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select()

    if (error) {
      console.error('Error updating profile:', error)
      return { error }
    } else {
      setProfile(data[0])
      setIsProfileComplete(!!(data[0]?.full_name && data[0]?.user_type))
      return { data: data[0] }
    }
  }

  const completeProfile = async (fullName: string, phone: string, userType: string) => {
    if (!user) return { error: new Error('Usuario no autenticado') }

    console.log('Starting profile completion for user:', user.id)

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        phone,
        user_type: userType,
      })
      .select()

    if (error) {
      console.error('Error completing profile:', error)
      return { error }
    } else {
      console.log('Profile saved successfully:', data[0])

      // Actualizar estado inmediatamente
      const updatedProfile = data[0]
      setProfile(updatedProfile)
      setIsProfileComplete(true)

      // Múltiples mecanismos de actualización para asegurar consistencia
      console.log('Triggering profile refresh...')

      // Refresh inmediato
      await fetchProfile()

      // Refresh adicional después de un breve delay
      setTimeout(async () => {
        console.log('Additional profile refresh...')
        await fetchProfile()
      }, 100)

      // Trigger final para asegurar que el listener se active
      setTimeout(async () => {
        console.log('Final profile refresh...')
        await fetchProfile()
      }, 300)

      return { data: updatedProfile }
    }
  }

  // Función para forzar refresh manual del perfil
  const refreshProfile = async () => {
    await fetchProfile()
  }

  return {
    profile,
    loading,
    isProfileComplete,
    fetchProfile,
    updateProfile,
    completeProfile,
    refreshProfile,
  }
}

export default useProfile
