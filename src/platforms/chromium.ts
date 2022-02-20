import type { Platform, TestConfig } from '../core'
import type { BuildOutputFile } from 'src/core/esbuild'

import { join } from 'path'

import playwright from 'playwright'
import { cwd } from 'process'
import { Observer } from 'rxjs'

import asyncObservable from '../utils/async-observable'
import { finalize, tap } from 'rxjs/operators'

export default ({ config, output }: { config: TestConfig, output: BuildOutputFile }) => {


  return (val) => {}
}
  // (val) => {
  //   return (
  //     asyncObservable(async (observer: Observer) => {
  //       const browser = await playwright.chromium.launchPersistent(join(cwd(), 'tmp/platform/chromium'), {
  //         headless: false,
  //         devtools: true
  //       })
    
  //       observer.next(
  //         messages => {
  //           const tab = browser.newPage()
  //           return (
  //             messages
  //               .pipe(
  //                 tap(val => console.log('chrome received msg', val)),
  //                 finalize(() => tab.then(tab => tab.close()))
  //               )
  //           )
  //         }
  //       )
    
  //       return ({}) => {
    
  //       }
  //     })
  //   )
  // }
