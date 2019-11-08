import { test } from '../../src/runtime/index.ts'

test('succeed', () => {})
test('fail', () => throw new Error())

test('promise succeed', () => Promise.resolve())
test('promise fail', () => Promise.reject())

test('async succeed', async () => {})
test('async fail', async () => throw new Error())