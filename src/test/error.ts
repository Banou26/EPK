import { isBrowser } from '../utils'

export const errors = []

if (isBrowser) {
  window.addEventListener('error', err => errors.push(err))
} else {
  process.on('uncaughtException', err => errors.push(err))
}

