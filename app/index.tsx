import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ProfileProvider, useProfileContext } from './contexts/ProfileContext'
import useAuth from './hooks/useAuth'
import HomeScreen from './screens/HomeScreen'
import LoginScreen from './screens/LoginScreen'
import ProfileSetupScreen from './screens/ProfileSetupScreen'
import RegisterScreen from './screens/RegisterScreen'
import ServiceDetailScreen from './screens/ServiceDetailScreen'

import { Ionicons } from '@expo/vector-icons'
import '../globals.css'
import BookingsScreen from './screens/BookingsScreen'
import GestionServiciosScreen from './screens/GestionServiciosScreen'
import ProfileScreen from './screens/ProfileScreen'
import ServiciosContratadosScreen from './screens/ServiciosContratadosScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function AuthStack() {
  return (
    <Stack.Navigator id={undefined}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

function ProfileSetupStack() {
  return (
    <Stack.Navigator id={undefined}>
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

function HomeStack() {
  return (
    <Stack.Navigator id={undefined}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

// MainTabs recibe userRole como prop
function MainTabs({ userRole }: { userRole: 'cliente' | 'proveedor' | null }) {
  const tabScreens = userRole === 'cliente'
    ? [
        { name: 'Inicio', component: HomeStack, icon: 'home' },
        { name: 'Mis Reservas', component: BookingsScreen, icon: 'bookmarks' },
        { name: 'Perfil', component: ProfileScreen, icon: 'person' },
      ]
    : [
        { name: 'Contratados', component: ServiciosContratadosScreen, icon: 'briefcase' },
        { name: 'Mis Servicios', component: GestionServiciosScreen, icon: 'grid' },
        { name: 'Perfil', component: ProfileScreen, icon: 'person' },
      ]

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const screen = tabScreens.find(s => s.name === route.name)
          const iconName = screen?.icon || 'help'
          return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={color} />
        },
        tabBarActiveTintColor: '#00d084',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#1e1e1e',
        },
        headerShown: false,
      })}
    >
      {tabScreens.map(screen => (
        <Tab.Screen key={screen.name} name={screen.name} component={screen.component} />
      ))}
    </Tab.Navigator>
  )
}

// Componente interno que usa el contexto
function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, isProfileComplete, userRole } = useProfileContext()

  // Debug logs para rastrear el estado
  useEffect(() => {
    console.log('AppContent Debug:', {
      user: !!user,
      authLoading,
      profileLoading,
      isProfileComplete,
      hasProfile: !!profile,
      userRole,
    })
  }, [user, authLoading, profileLoading, isProfileComplete, profile, userRole])

  if (authLoading || (user && profileLoading)) {
    return null // O un loader
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {user ? isProfileComplete ? <MainTabs userRole={userRole} /> : <ProfileSetupStack /> : <AuthStack />}
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <ProfileProvider>
      <AppContent />
    </ProfileProvider>
  )
}
