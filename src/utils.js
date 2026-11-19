export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const MOMENTOS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena']
export const CATEGORIAS = ['Saludable', 'Vegetariano', 'Proteico', 'Rápido', 'Postre']

// Traduce errores de Firebase a mensajes entendibles.
export function mensajeError(error) {
  if (error?.code === 'permission-denied') {
    return 'Sin permisos. Revisá que las reglas de Firestore estén publicadas.'
  }
  if (error?.code === 'unavailable') {
    return 'No hay conexión con Firebase. Probá de nuevo.'
  }
  return 'Ocurrió un error. Probá de nuevo.'
}
