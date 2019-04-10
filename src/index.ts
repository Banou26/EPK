export * from './core/index.ts'
export * from './test/index.ts'

if (!module.parent) import('./cli/index.ts').then(() => {}) // keep the then because parcel lazy-load imports
