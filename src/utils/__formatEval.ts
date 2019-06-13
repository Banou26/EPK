import { EPK_GLOBAL_EVENT_TARGET, getMessageResponse } from '../types.ts'

const browserEval = (type, data) => `
globalThis.${EPK_GLOBAL_EVENT_TARGET}.addEventListener('${getMessageResponse(type)}', listener)
globalThis.${EPK_GLOBAL_EVENT_TARGET}.dispatchEvent(new CustomEvent('${type}', ${JSON.stringify({ detail: data })}))
`

const nodeEval = (type, data) => `
globalThis.${EPK_GLOBAL_EVENT_TARGET}.addListener('${getMessageResponse(type)}', listener)
globalThis.${EPK_GLOBAL_EVENT_TARGET}.emit('${type}', ${JSON.stringify(data)})

`

export default (browser, type, data = {}) => `
new Promise(resolve => {
  const listener = ({ ${browser ? 'detail' : 'data'}: data }) => {
    globalThis.${browser ? 'removeEventListener' : 'removeListener'}('${getMessageResponse(type)}', listener)
    resolve(data)
  }
  ${
    browser
    ? browserEval(type, data)
    : nodeEval(type, data)
  }
})
`
