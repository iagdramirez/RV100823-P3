import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import useAuth from '../hooks/useAuth'

interface Profile {
  id: string
  full_name: string
  phone: string
  user_type: string
  created_at: string
  updated_at: string
}

interface ProfileContextType {
  profile: Profile | null
  loading: boolean
  isProfileComplete: boolean
  userRole: 'cliente' | 'proveedor' | null
  refreshProfile: () => Promise<void>
  completeProfile: (fullName: string, phone: string, userType: string) => Promise<{ data?: Profile; error?: Error }>
  triggerProfileUpdate: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export const useProfileContext = () => {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider')
  }
  return context
}

interface ProfileProviderProps {
  children: ReactNode
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProfileComplete, setIsProfileComplete] = useState(false)

  const userRole: 'cliente' | 'proveedor' | null = profile?.user_type === 'proveedor' ? 'proveedor' : profile?.user_type === 'cliente' ? 'cliente' : null

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setIsProfileComplete(false)
      setLoading(false)
      return
    }

    setLoading(true)
    console.log('ProfileContext: Fetching profile for user:', user.id)

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()

    if (error) {
      console.error('ProfileContext: Error fetching profile:', error)
      setProfile(null)
      setIsProfileComplete(false)
    } else {
      console.log('ProfileContext: Profile fetched successfully:', data)
      setProfile(data)
      const complete = !!(data?.full_name && data?.user_type)
      setIsProfileComplete(complete)
      console.log('ProfileContext: Profile complete status:', complete)
    }
    setLoading(false)
  }, [user])

  // Evento personalizado para notificar cuando el perfil se complete
  const triggerProfileUpdate = useCallback(() => {
    console.log('ProfileContext: Triggering profile update event')
    if (user) {
      fetchProfile()
    }
  }, [user, fetchProfile])

  // Exponer la función de trigger globalmente para que otros componentes puedan usarla
  useEffect(() => {
    ;(window as any).triggerProfileUpdate = triggerProfileUpdate
    return () => {
      delete (window as any).triggerProfileUpdate
    }
  }, [user, triggerProfileUpdate])


  const completeProfile = async (fullName: string, phone: string, userType: string) => {
    if (!user) return { error: new Error('Usuario no autenticado') }

    // Validar que userType sea 'cliente' o 'proveedor'
    if (userType !== 'cliente' && userType !== 'proveedor') {
      return { error: new Error('Tipo de usuario inválido. Debe ser "cliente" o "proveedor".') }
    }

    console.log('ProfileContext: Starting profile completion for user:', user.id)

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
      console.error('ProfileContext: Error completing profile:', error)
      return { error }
    } else {
      console.log('ProfileContext: Profile saved successfully:', data[0])

      // Actualizar estado inmediatamente
      const updatedProfile = data[0]
      setProfile(updatedProfile)
      setIsProfileComplete(true)

      // Forzar refresh inmediato
      await fetchProfile()

      return { data: updatedProfile }
    }
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  useEffect(() => {
    if (user) {
      fetchProfile()

      // Suscribirse a cambios en la tabla profiles
      const subscription = supabase
        .channel(`profile_context_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          payload => {
            console.log('ProfileContext: Profile updated via subscription:', payload)
            fetchProfile()
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

  const value: ProfileContextType = {
    profile,
    loading,
    isProfileComplete,
    userRole,
    refreshProfile,
    completeProfile,
    triggerProfileUpdate,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export default { ProfileProvider, useProfileContext }
