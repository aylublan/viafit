export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const MOMENTOS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena']
export const CATEGORIAS = ['Saludable', 'Vegetariano', 'Proteico', 'Rápido', 'Postre']
export const DIFICULTADES = ['Fácil', 'Media', 'Difícil']

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

// Reduce la foto (máx. 900 px, JPEG) para guardarla como texto dentro del
// documento de Firestore, sin necesidad de Firebase Storage.
export function comprimirImagen(file, maxLado = 900) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo elegido no es una imagen.'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * escala)
      canvas.height = Math.round(img.height * escala)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      let calidad = 0.75
      let data = canvas.toDataURL('image/jpeg', calidad)
      while (data.length > 300000 && calidad > 0.4) {
        calidad -= 0.1
        data = canvas.toDataURL('image/jpeg', calidad)
      }
      resolve(data)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen. Probá con JPG o PNG.'))
    }
    img.src = url
  })
}
