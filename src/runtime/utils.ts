import { Subject } from 'rxjs'
import { map } from 'rxjs/operators'
import { parse, stringify } from '../utils/flatted.ts'

import { EPK_SUBJECT, EPK_RUNTIME_SUBJECT } from '../types.ts'

const subject = globalThis[EPK_SUBJECT] = new Subject()
export const inMessages =
  // @ts-ignore
  subject
  // @ts-ignore
  |> map(parse)

const sendMessage = globalThis[EPK_RUNTIME_SUBJECT]
export const outMessages = new Subject()
// @ts-ignore
outMessages.subscribe(value =>
  sendMessage(stringify(value)))