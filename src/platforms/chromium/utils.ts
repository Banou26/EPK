import { EVENT } from '../../utils/runtime'

export const eventToEpkEvent = (event: EVENT) =>
  `epk${event[0].toUpperCase()}${event.slice(1)}` as unknown as `epk${Capitalize<EVENT>}`
