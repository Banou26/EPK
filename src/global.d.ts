import { assert as chaiAssert, expect as chaiExpect } from 'chai'
import {
  // group as bGroup,
  // querySelector as bQuerySelector,
  test as bTest,
  group as bGroup,
} from './runtime'

declare global {
  var assert: typeof chaiAssert
  var expect: typeof chaiExpect
  // var group: typeof bGroup
  // var querySelector: typeof bQuerySelector
  var test: typeof bTest
  var group: typeof bGroup
}

export {}
