// export * from './test'
// export * from './assert'

// parceljs experimental hoisting fix
import { test } from './test'
import { assert } from './assert'

export {
  test,
  assert
}