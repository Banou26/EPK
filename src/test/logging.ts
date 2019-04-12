import { LogType, Log } from '../types.ts'
import { globalVariable, isBrowser } from '../core/utils.ts'

export const logs: Log[] = []

const catchUncaughtException = (_err: Error | ErrorEvent | PromiseRejectionEvent) => {
  const err =
    isBrowser
      // eslint-disable-next-line
      ? _err instanceof ErrorEvent
        ? _err.error
        // eslint-disable-next-line
        : _err instanceof PromiseRejectionEvent &&
          _err.reason
      : _err

  logs.push({
    type: LogType.uncaughtError,
    error: {
      // @ts-ignore
      name: err.name,
      message: err.message,
      string: err.toString(),
      // @ts-ignore
      stack: err.stack
    }
  })
}

if (isBrowser) {
  window.addEventListener('error', catchUncaughtException)
  window.addEventListener('unhandledrejection', catchUncaughtException)
} else {
  process.on('uncaughtException', catchUncaughtException)
  process.on('unhandledRejection', catchUncaughtException)
}

(<any>globalVariable).console = new Proxy<Console>(globalVariable.console, {
  get: (target, property, receiver) =>
    Object.keys(LogType).includes(<string>property)
      ? (...args) => {
        logs.push({ type: <LogType>property, arguments: args })
        return Reflect.get(target, property, receiver)(...args)
      }
      : Reflect.get(target, property, receiver)
})
