import { isBrowser } from '../utils'

export const errors = []

if (isBrowser) {
  window.onerror = err => errors.push(err)
} else {
  process.on('uncaughtException', err => errors.push(err))
}

