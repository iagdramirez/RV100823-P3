import React from 'react'
import { Text, View } from 'react-native'

interface HeaderProps {
  title: string
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <View className="py-4 px-4 bg-primary border-b border-tertiary">
      <Text className="text-2xl font-semibold text-text">{title}</Text>
    </View>
  )
}

export default Header
