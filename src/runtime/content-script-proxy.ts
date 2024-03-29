import { toGlobal } from '../utils/runtime'

window.addEventListener('message', ({ data }) => {
  if (typeof data !== 'object' || data === null || data.__epk__ !== true) return
  if (data.name === 'initDone') {
    console.log('CONTENT SCRIPT INIT DONE')
    globalThis[toGlobal('initDone')]()
  }
  if (data.name === 'event') globalThis[toGlobal('event')](JSON.parse(data.value))
})
