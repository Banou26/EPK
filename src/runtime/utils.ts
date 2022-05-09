import type { Page } from 'playwright'
import { toGlobal } from '../utils/runtime'

export const waitForSelector: Page['waitForSelector'] = (...args) => globalThis[toGlobal('waitForSelector')](...args)
