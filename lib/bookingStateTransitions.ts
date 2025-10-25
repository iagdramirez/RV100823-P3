export type BookingState = 'pendiente' | 'confirmada' | 'en proceso' | 'completada' | 'cancelada';

export interface StateTransition {
  from: BookingState;
  to: BookingState[];
  description: string;
}

export const validTransitions: Record<BookingState, BookingState[]> = {
  'pendiente': ['confirmada', 'cancelada'],
  'confirmada': ['en proceso', 'completada', 'cancelada'],
  'en proceso': ['completada', 'cancelada'],
  'completada': [],
  'cancelada': []
};

export const stateDescriptions: Record<BookingState, string> = {
  'pendiente': 'El servicio está pendiente de confirmación.',
  'confirmada': 'El servicio ha sido confirmado y está listo para comenzar.',
  'en proceso': 'El servicio está siendo ejecutado.',
  'completada': 'El servicio ha sido completado exitosamente.',
  'cancelada': 'El servicio ha sido cancelado y no se ejecutará.'
};

export const isValidTransition = (currentState: BookingState, newState: BookingState): boolean => {
  return validTransitions[currentState]?.includes(newState) || false;
};

export const getValidTransitions = (currentState: BookingState): BookingState[] => {
  return validTransitions[currentState] || [];
};

export const getStateDescription = (state: BookingState): string => {
  return stateDescriptions[state] || 'Estado desconocido.';
};

export const validateStateChange = (currentState: BookingState, newState: BookingState): { valid: boolean; error?: string } => {
  if (currentState === newState) {
    return { valid: false, error: 'El estado no puede ser el mismo.' };
  }

  if (!isValidTransition(currentState, newState)) {
    const validStates = getValidTransitions(currentState).join(', ');
    return {
      valid: false,
      error: `Transición inválida desde '${currentState}' a '${newState}'. Estados válidos: ${validStates}.`
    };
  }

  return { valid: true };
};