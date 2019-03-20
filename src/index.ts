export * from './core/index'
export * from './test/index'

if (!module.parent) import('./cli/index').then(() => {}) // keep the then because else, the code isn't executed
