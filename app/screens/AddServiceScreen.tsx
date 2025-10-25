import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { Alert, FlatList, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Button from '../components/Button'
import Input from '../components/Input'
import useAuth from '../hooks/useAuth'
import useServices from '../hooks/useServices'

const AddServiceScreen: React.FC = () => {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precio, setPrecio] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh for form
    setTimeout(() => setRefreshing(false), 1000)
  }

  const { user } = useAuth()
  const { addService } = useServices()
  const navigation = useNavigation()

  const handleAddService = async () => {
    // Validar autenticación
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para agregar servicios')
      return
    }

    // Validar campos requeridos
    if (!titulo.trim() || !descripcion.trim() || !categoria.trim() || !precio.trim() || !ubicacion.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios')
      return
    }

    // Validar precio
    const precioNum = parseFloat(precio)
    if (isNaN(precioNum) || precioNum <= 0) {
      Alert.alert('Error', 'Ingresa un precio válido mayor a 0')
      return
    }

    setLoading(true)

    try {
      const { error } = await addService({
        id_proveedor: user.id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria: categoria.trim(),
        precio: precioNum,
        ubicacion: ubicacion.trim(),
        imagen_url: imagenUrl.trim() || 'https://www.cams-it.com/wp-content/uploads/2015/05/default-placeholder-350x200.png',
      })

      if (error) {
        Alert.alert('Error', 'No se pudo agregar el servicio: ' + error.message)
      } else {
        Alert.alert('Éxito', 'Servicio agregado correctamente', [{ text: 'OK', onPress: () => navigation.goBack() }])

        // Resetear campos
        setTitulo('')
        setDescripcion('')
        setCategoria('')
        setPrecio('')
        setUbicacion('')
        setImagenUrl('')
      }
    } catch (error) {
      console.error('Error adding service:', error)
      Alert.alert('Error', 'Error inesperado al agregar el servicio')
    } finally {
      setLoading(false)
    }
  }

  const categoriasSugeridas = [
    'Limpieza',
    'Plomería',
    'Electricidad',
    'Jardinería',
    'Belleza',
    'Mantenimiento',
    'Reparaciones',
    'Pintura',
    'Carpintería',
    'Mudanzas',
    'Eventos',
    'Salud',
    'Educación',
    'Tecnología',
    'Automotriz',
    'Construcción',
    'Diseño',
    'Cocina',
    'Mascotas',
    'Transporte',
    'Seguridad',
    'Consultoría',
    'Fotografía',
    'Música',
    'Deportes',
    'Otros'
  ]

  const selectCategory = (cat: string) => {
    setCategoria(cat)
    setModalVisible(false)
  }

  return (
    <ScrollView className="flex-1 bg-primary px-5 pb-4 pt-16" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text className="text-2xl font-semibold text-text mb-4 text-center">Agregar Nuevo Servicio</Text>

      <Input placeholder="Título del servicio" value={titulo} onChangeText={setTitulo} />

      <Input placeholder="Descripción detallada" value={descripcion} onChangeText={setDescripcion} multiline numberOfLines={3} />

      <Text className="text-text font-semibold mb-2 mt-2">Categoría:</Text>
      <TouchableOpacity
        className="border border-tertiary rounded-lg p-3 mb-4 bg-primary"
        onPress={() => setModalVisible(true)}
      >
        <Text className={`text-base ${categoria ? 'text-text' : 'text-textSecondary'}`}>
          {categoria || 'Selecciona una categoría'}
        </Text>
      </TouchableOpacity>

      <Input placeholder="Precio (ej: 25.00)" value={precio} onChangeText={setPrecio} keyboardType="numeric" />

      <Input placeholder="Ubicación donde ofreces el servicio" value={ubicacion} onChangeText={setUbicacion} />

      <Input placeholder="URL de imagen (opcional)" value={imagenUrl} onChangeText={setImagenUrl} autoCapitalize="none" />

      <Button title="Agregar Servicio" onPress={handleAddService} disabled={loading} />

      {categoria && <Text className="text-accent text-center mt-2 italic">Categoría seleccionada: {categoria}</Text>}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <TouchableOpacity className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setModalVisible(false)}>
          <View className="bg-primary rounded-t-lg p-4" style={{ maxHeight: 300 }}>
            <Text className="text-lg font-semibold mb-4 text-center text-text">Selecciona una Categoría</Text>
            <FlatList
              data={categoriasSugeridas}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`p-3 border-b border-tertiary ${categoria === item ? 'bg-accent' : ''}`}
                  onPress={() => selectCategory(item)}
                >
                  <Text className={`text-base ${categoria === item ? 'text-primary' : 'text-text'}`}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity className="mt-4 p-3 bg-tertiary rounded-lg" onPress={() => setModalVisible(false)}>
              <Text className="text-primary text-center font-semibold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  )
}

export default AddServiceScreen
