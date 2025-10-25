import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { Service } from '../hooks/useServices'

interface ServiceCardProps {
  service: Service
  onPress: () => void
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress }) => {
  return (
    <TouchableOpacity
      className="bg-secondary rounded-2xl p-3 shadow-lg active:scale-95 transition-all duration-200"
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View className="rounded-xl overflow-hidden mb-3">
        <Image source={{ uri: service.imagen_url }} className="w-full aspect-square" resizeMode="cover" />
      </View>
      <View>
        <Text className="text-text font-semibold text-lg mb-1">{service.titulo}</Text>
        <Text className="text-textSecondary text-sm mb-2">{service.categoria}</Text>
        <Text className="text-accent font-bold text-base mb-1">${service.precio}</Text>
        <Text className="text-textSecondary text-sm">{service.ubicacion}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default ServiceCard
