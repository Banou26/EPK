const originalConsole = globalThis.console

export const console = {
  ...originalConsole,
  error: (...args) => originalConsole.error('[EPK-LOG]', ...args),
  warning: (...args) => originalConsole.warn('[EPK-LOG]', ...args),
  info: (...args) => originalConsole.info('[EPK-LOG]', ...args),
  log: (...args) => originalConsole.log('[EPK-LOG]', ...args)
}
