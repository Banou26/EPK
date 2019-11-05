import { Subject } from 'rxjs'

export enum GLOBALS {
  MESSAGES = '__EPK_MESSAGES',
  SEND_MESSAGE = '__EPK_SEND_MESSAGE'
}

globalThis[GLOBALS.MESSAGES] = new Subject()
