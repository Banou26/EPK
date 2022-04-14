import type { Page } from 'playwright'

import type { OverloadParameters } from '../../utils/overloads'
import type { Event, EVENT } from '../../utils/runtime'

export type EPKPage = Omit<Page, 'on'> & {
  emit<T extends Capitalize<EVENT>>(event: `epk${T}`, arg: Event<Uncapitalize<T>>['data']): EPKPage
  on<T extends Capitalize<EVENT>>(event: `epk${T}`, listener: (data: Event<Uncapitalize<T>>['data']) => void): EPKPage
  on<T extends OverloadParameters<Page['on']>[0]>(event: T, listener: (...arg: Parameters<Extract<OverloadParameters<Page['on']>, [T, any]>[1]>) => void): EPKPage
}
