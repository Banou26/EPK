
export const stringify = (strings, ...vals) =>
  strings.reduce((finalStr, str, i) =>
    `${finalStr}${str}${vals.length > i ? JSON.stringify(vals[i]) : ''}`, '')

export const prettifyTime = time =>
  time < 1000
    ? `${time.toFixed()}ms`
    : `${(time / 1000).toFixed(2)}s`

export const isBrowser = typeof window !== 'undefined'

export const globalVariable = isBrowser ? window : global
