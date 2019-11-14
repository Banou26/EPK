import { test } from '../../src/runtime/index.ts'

test('succeed', () => {})
test('fail', () => throw new Error())

test('promise succeed', () => Promise.resolve())
test('promise fail', () => Promise.reject())

test('async succeed', async () => {})
test('async fail', async () => throw new Error())

test.serial('serial succeed', () => {})
test.serial('serial fail', () => throw new Error())

test.serial('serial promise succeed', () => Promise.resolve())
test.serial('serial promise fail', () => Promise.reject())

test.serial('serial async succeed', async () => {})
test.serial('serial async fail', async () => throw new Error())
