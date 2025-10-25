import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        // Verificar si hay datos pendientes de perfil
        const pendingData = await AsyncStorage.getItem('pendingProfileData')
        if (pendingData) {
          try {
            const profileData = JSON.parse(pendingData)

            // Verificar si el perfil ya existe
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle()

            if (!existingProfile) {
              // Crear el perfil
              const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                  id: session.user.id,
                  full_name: profileData.fullName,
                  phone: profileData.phone,
                  user_type: profileData.userType,
                })

              if (!profileError) {
                // Eliminar los datos pendientes
                await AsyncStorage.removeItem('pendingProfileData')
              }
            }
          } catch (error) {
            console.error('Error parsing pending profile data:', error)
            // Remove invalid data
            await AsyncStorage.removeItem('pendingProfileData')
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return { user, loading, signUp, signIn, signOut }
}

export default useAuth
