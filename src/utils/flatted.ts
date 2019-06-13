import { stringify as _stringify, parse as _parse } from 'flatted'

import { EPK_FUNCTION_PROPERTY_PLACEHOLDER } from '../types.ts'

export const stringify = data =>
  _stringify(
    data,
    (key, val) =>
      typeof val === 'function'
        ? {
          [EPK_FUNCTION_PROPERTY_PLACEHOLDER]: val.name
        }
        : val)

export const parse = data =>
  _parse(
    data,
    (_, val) =>
      val?.[EPK_FUNCTION_PROPERTY_PLACEHOLDER]
        // Way to dynamically set a function name (to render via `util.inspect` from the reporter)
        ? {
          [val[EPK_FUNCTION_PROPERTY_PLACEHOLDER]]: () => {}
        }[val[EPK_FUNCTION_PROPERTY_PLACEHOLDER]]
        : val)