import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native'
import ServiceCard from '../components/ServiceCard'
import { useProfileContext } from '../contexts/ProfileContext'
import useServices from '../hooks/useServices'

const HomeScreen: React.FC = () => {
  const navigation = useNavigation()
  const { services, loading, fetchServices } = useServices()
  const { userRole } = useProfileContext()
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchServices()
    setRefreshing(false)
  }

  const filteredServices = services.filter(service => service.titulo.toLowerCase().includes(search.toLowerCase()))

  return (
    <View className="flex-1 bg-primary px-5 pb-4 pt-16">
      {/* Header with title and add button */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Text className="text-2xl font-semibold text-text mr-2">Inicio</Text>
        </View>
        {userRole === 'proveedor' && (
          <TouchableOpacity className="bg-accent p-2 rounded-full" onPress={() => (navigation as any).navigate('Servicios')}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search bar */}
      <View className="flex-row items-center bg-secondary rounded-2xl p-3 mb-4">
        <Ionicons name="search" size={20} color="#a1a1aa" />
        <TextInput
          className="flex-1 ml-2 text-text"
          placeholder="Buscar servicios..."
          placeholderTextColor="#a1a1aa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Services grid */}
      {loading ? (
        <Text className="text-textSecondary text-center">Cargando...</Text>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <View className="w-1/2 pr-2 pb-4">
              <ServiceCard service={item} onPress={() => (navigation as any).navigate('ServiceDetail', { service: item })} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  )
}

export default HomeScreen
