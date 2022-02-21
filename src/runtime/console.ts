export const console = {
  ...globalThis.console,
  error: (...args) => globalThis.console.error('[EPK-LOG]', ...args),
  warning: (...args) => globalThis.console.warn('[EPK-LOG]', ...args),
  info: (...args) => globalThis.console.info('[EPK-LOG]', ...args),
  log: (...args) => globalThis.console.log('[EPK-LOG]', ...args)
}
