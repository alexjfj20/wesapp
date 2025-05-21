/* eslint-disable no-console */

import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready () {
      console.log(
        'App is being served from cache by a service worker.\n' +
        'Para más información, visite https://goo.gl/AFskqB'
      )
    },
    registered () {
      console.log('Service worker ha sido registrado.')
    },
    cached () {
      console.log('El contenido ha sido cacheado para uso offline.')
    },
    updatefound () {
      console.log('Descargando nuevo contenido.')
    },
    updated () {
      console.log('Nuevo contenido disponible; por favor actualiza la página.')
    },
    offline () {
      console.log('Sin conexión a internet. La app está funcionando en modo offline.')
    },
    error (error) {
      console.error('Error durante el registro del service worker:', error)
    }
  })
}