import React from 'react'
import { Text, TouchableOpacity } from 'react-native'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  style?: any
}

const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary', disabled = false, style }) => {
  const baseClasses = 'py-3 px-6 rounded-2xl items-center justify-center'
  const variantClasses = variant === 'primary' ? 'bg-accent' : 'bg-tertiary'
  const disabledClasses = disabled ? 'opacity-50' : ''
  const textClasses = 'text-white font-semibold text-base'

  return (
    <TouchableOpacity className={`${baseClasses} ${variantClasses} ${disabledClasses}`} onPress={onPress} disabled={disabled} style={style}>
      <Text className={textClasses}>{title}</Text>
    </TouchableOpacity>
  )
}

export default Button
