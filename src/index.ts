export * from './core/index'
export * from './test/index'

if (!module.parent) import('./cli/index').then(() => {})
