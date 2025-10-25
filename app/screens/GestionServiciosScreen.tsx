import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { Alert, FlatList, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Button from '../components/Button'
import Input from '../components/Input'
import { useProfileContext } from '../contexts/ProfileContext'
import useAuth from '../hooks/useAuth'
import useServices from '../hooks/useServices'

const GestionServiciosScreen: React.FC = () => {
  const navigation = useNavigation()
  const { user } = useAuth()
  const { userRole } = useProfileContext()
  const { services, loading, fetchServices, addService, deleteService } = useServices()
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precio, setPrecio] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchServices()
    setRefreshing(false)
  }

  const handleAddService = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para agregar servicios')
      return
    }

    if (!titulo.trim() || !descripcion.trim() || !categoria.trim() || !precio.trim() || !ubicacion.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios')
      return
    }

    const precioNum = parseFloat(precio)
    if (isNaN(precioNum) || precioNum <= 0) {
      Alert.alert('Error', 'Ingresa un precio válido mayor a 0')
      return
    }

    setLoadingAdd(true)

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
        Alert.alert('Éxito', 'Servicio agregado correctamente')
        resetForm()
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Error adding service:', error)
      Alert.alert('Error', 'Error inesperado al agregar el servicio')
    } finally {
      setLoadingAdd(false)
    }
  }

  const resetForm = () => {
    setTitulo('')
    setDescripcion('')
    setCategoria('')
    setPrecio('')
    setUbicacion('')
    setImagenUrl('')
  }

  const handleDeleteService = async (id: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteService(id)
            if (error) {
              Alert.alert('Error', 'No se pudo eliminar el servicio')
            } else {
              Alert.alert('Éxito', 'Servicio eliminado')
            }
          },
        },
      ]
    )
  }

  const categoriasSugeridas = [
    'Limpieza', 'Plomería', 'Electricidad', 'Jardinería', 'Belleza', 'Mantenimiento',
    'Reparaciones', 'Pintura', 'Carpintería', 'Mudanzas', 'Eventos', 'Salud',
    'Educación', 'Tecnología', 'Automotriz', 'Construcción', 'Diseño', 'Cocina',
    'Mascotas', 'Transporte', 'Seguridad', 'Consultoría', 'Fotografía', 'Música',
    'Deportes', 'Otros'
  ]

  const selectCategory = (cat: string) => {
    setCategoria(cat)
    setModalVisible(false)
  }

  const misServicios = services.filter(s => s.id_proveedor === user?.id)

  if (userRole !== 'proveedor') {
    return (
      <View className="flex-1 bg-primary justify-center items-center px-5 pb-4 pt-16">
        <Text className="text-2xl font-semibold text-text mb-4">Acceso Denegado</Text>
        <Text className="text-textSecondary text-center">Esta sección es solo para proveedores.</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-primary px-5 pb-4 pt-16">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-semibold text-text">Mis Servicios</Text>
        <TouchableOpacity className="bg-accent p-2 rounded-full" onPress={() => setShowAddForm(!showAddForm)}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <ScrollView className="mb-4 p-4 bg-secondary rounded-2xl shadow-md">
          <Text className="text-lg font-semibold text-text mb-3">Agregar Nuevo Servicio</Text>
          <Input placeholder="Título del servicio" value={titulo} onChangeText={setTitulo} />
          <Input placeholder="Descripción detallada" value={descripcion} onChangeText={setDescripcion} multiline numberOfLines={3} />
          <Text className="text-text font-semibold mb-2 mt-2">Categoría:</Text>
          <TouchableOpacity className="border border-tertiary rounded-lg p-3 mb-4 bg-primary" onPress={() => setModalVisible(true)}>
            <Text className={`text-base ${categoria ? 'text-text' : 'text-textSecondary'}`}>
              {categoria || 'Selecciona una categoría'}
            </Text>
          </TouchableOpacity>
          <Input placeholder="Precio (ej: 25.00)" value={precio} onChangeText={setPrecio} keyboardType="numeric" />
          <Input placeholder="Ubicación donde ofreces el servicio" value={ubicacion} onChangeText={setUbicacion} />
          <Input placeholder="URL de imagen (opcional)" value={imagenUrl} onChangeText={setImagenUrl} autoCapitalize="none" />
          <Button title="Agregar Servicio" onPress={handleAddService} disabled={loadingAdd} />
        </ScrollView>
      )}

      {loading ? (
        <Text className="text-textSecondary text-center">Cargando...</Text>
      ) : misServicios.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-textSecondary text-lg mb-2">No tienes servicios aún</Text>
          <Text className="text-textSecondary text-center">¡Agrega tu primer servicio para empezar!</Text>
        </View>
      ) : (
        <FlatList
          data={misServicios}
          keyExtractor={item => item.id}
          numColumns={1}
          renderItem={({ item }) => (
            <View className="bg-secondary rounded-2xl p-4 mb-3 shadow-md">
              <Text className="text-text font-semibold text-lg mb-1">{item.titulo}</Text>
              <Text className="text-textSecondary text-sm mb-2">{item.categoria}</Text>
              <Text className="text-accent font-bold text-base mb-1">${item.precio}</Text>
              <Text className="text-textSecondary text-sm mb-2">{item.ubicacion}</Text>
              <TouchableOpacity
                className="bg-red-600 p-2 rounded-lg mt-2"
                onPress={() => handleDeleteService(item.id)}
              >
                <Text className="text-white text-center">Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

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
    </View>
  )
}

export default GestionServiciosScreen