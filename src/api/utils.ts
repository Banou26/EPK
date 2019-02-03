import Path from 'path'
import { Page } from 'puppeteer'
import { MESSAGE_TYPE } from '../types'

export const prettifyPath = path => Path.relative(process.cwd(), path)

export const transformPathToUrl = path => path.replace(`${Path.resolve(process.cwd(), '.epk', 'dist')}\\`, '/tests/')

export const prettifyTime = time =>
  time < 1000
    ? `${time.toFixed()}ms`
    : `${(time / 1000).toFixed(2)}s`

export const callPageFunction =
  (page: Page, type: MESSAGE_TYPE, ...payload) =>
    page.evaluate(
      ({ type, payload }: { type: MESSAGE_TYPE, payload: any[] }) =>
        window[type](...payload),
      { type, payload }
    )
