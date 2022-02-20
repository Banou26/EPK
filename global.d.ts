import { assert as chaiAssert, expect as chaiExpect } from 'chai'
import {
  // describe as bDescribe,
  // querySelector as bQuerySelector,
  test as bTest,
} from './src/runtime'

declare global {
  var assert: typeof chaiAssert
  var expect: typeof chaiExpect
  // var describe: typeof bDescribe
  // var querySelector: typeof bQuerySelector
  var test: typeof bTest
}
