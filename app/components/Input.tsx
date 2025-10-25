import React from 'react'
import { TextInput, TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  placeholder: string
}

const Input: React.FC<InputProps> = ({ placeholder, ...props }) => {
  return (
    <TextInput
      className="border border-tertiary rounded-2xl px-3 py-2.5 text-base mb-3 text-text"
      placeholder={placeholder}
      placeholderTextColor="#a1a1aa"
      {...props}
    />
  )
}

export default Input
