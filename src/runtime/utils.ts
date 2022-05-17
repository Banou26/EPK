import type { ElementHandle, JSHandle, Page } from 'playwright'
import type { EPKPage } from '../platforms/chromium/types'
import { toGlobal } from '../utils/runtime'

export const epkEval =
  <
    T extends any[],
    T2 extends (ctx: { page: EPKPage }, ...args: T) => Promise<any>
  >(func: T2, ...args: T): ReturnType<T2> =>
    globalThis[toGlobal('epkEval')](func.toString(), ...args)

export const epkEvalHandle =
  <
    T extends JSHandle | ElementHandle,
    T2 extends (ctx: { page: EPKPage }, handle: T) => Promise<any>
  >(func: T2, handle: T): ReturnType<T2> =>
    globalThis[toGlobal('epkEvalHandle')]({ functionString: func.toString(), handle })

export const waitForSelector = (selector: Parameters<Page['waitForSelector']>[0], options: Parameters<Page['waitForSelector']>[1] = { timeout: 5000 }) =>
  epkEval(({ page }, ...args) => page.waitForSelector(...args), selector, options) as unknown as Promise<SVGElement | HTMLElement>
