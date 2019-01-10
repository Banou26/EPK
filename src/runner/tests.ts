import fs from 'fs'
import util from 'util'
import draftlog from 'draftlog'
import puppeteer from 'puppeteer'
import { interval, Observable, timer, pipe, from, of } from 'rxjs'
import { tap, takeUntil, delay, mergeMap, switchMap, take, publish, refCount } from 'rxjs/operators'
import { prettifyTime, log } from './utils.ts'
import { TESTS_METADATA } from '../utils.ts'
import './server.ts'
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

// const ob = timer(0, 1000)
//   |> tap(val => console.log(val))

// ob.subscribe(_ => {})

// const script = `
// const iframe = document.createElement('iframe')
// document.body.appendChild(iframe)
// iframe.srcdoc = \`
// <!DOCTYPE html>
// <script>
//     console.log(Date.now())
// </script>
// \`
// console.log(Date.now())
// `;

// (async _ => {
//   const browser = await puppeteer.launch({ devtools: true })
//   const page = await browser.newPage()
//   await page.bringToFront()

//   page.on('console', msg => console.log(msg.text()))
//   await page.coverage.startJSCoverage()
//   await page.reload()
//   await new Promise(resolve => setTimeout(resolve, 1000))
//   // await page.evaluate(script)
//   // await page.goto(`data:text/html,<script>${script}</script>`, { waitUntil: 'networkidle0' })
//   await page.goto(`http://localhost:10485`)
//   const jsCoverage = await page.coverage.stopJSCoverage()
//   let totalBytes = 0
//   let usedBytes = 0
//   const coverage = [...jsCoverage]
//   // console.log(jsCoverage)
//   writeFile('./.epk/js-coverage.json', JSON.stringify(jsCoverage))
//   for (const entry of coverage) {
//     totalBytes += entry.text.length
//     for (const range of entry.ranges)
//       usedBytes += range.end - range.start - 1
//   }
//   console.log(`Bytes used: ${usedBytes / totalBytes * 100}%, ${usedBytes}-${totalBytes-usedBytes}:${totalBytes}`)
//   // page.close()
// })()

// async (browser, bundle) => {
//   const page = await browser.newPage()
//   // page.on('console', msg => console.log(msg.text()))
//   const result = await new Promise(async (resolve, reject) => {
//     await page.exposeFunction(TESTS_METADATA, resolve)
//     // page.evaluate(await readFile(bundle.name, 'utf8'))
//     page.setContent(`<!DOCTYPE html><script>${await readFile(bundle.name, 'utf8')}</script>`)
//   })
//   await page.close()
//   return result
// }

// const t =
//   timer(0, 5000)
//     .pipe(
//       switchMap(i =>
//         Observable.create(observer => {
//           return _ => console.log('UNREGISTERED')
//         })),
//       publish()
//     )

// const obs = t.refCount()

// const sub = obs.subscribe(_ => console.log('sub'))
// t.connect()
// setTimeout(_ => {
//   sub.unsubscribe()
// }, 10000)


// const sub =
//   timer(0, 5000)
//     .pipe(
//       log(_ => `k`,
//         switchMap(val =>
//           of(val, val, val)
//             .pipe(
//               mergeMap(_ =>
//                 Observable.create(observer => {
//                   const obs =
//                     timer(0, 1000)
//                       .pipe(
//                         tap(i => console.log(i)),
//                         publish()
//                       )
//                   const isub = obs.refCount().subscribe(_ => {})
//                   obs.connect()
//                   observer.next(_)
//                   return _ => {
//                     console.log('unsubd')
//                     isub.unsubscribe()
//                   }
//                 })
//             )))
//     )).subscribe(_ => {})
// setTimeout(_ => sub.unsubscribe(), 8000)


// (async _ => {
//   const t0 = Date.now()
//   const file = await readFile('./.epk/dist/asserts.spec.js', 'utf8')
//   console.log(`Read file: ${Date.now() - t0}ms`)
//   // const t0 = Date.now()
//   // const file = await readFile('./.epk/dist/asserts.spec.js', 'utf8')
//   // console.log(`Read file: ${Date.now() - t0}ms`)

//   const browser = await puppeteer.launch({ devtools: false, args: ['--allow-file-access-from-files', '--enable-local-file-accesses'] })
//   const t = Date.now()
//   const t1 = Date.now()
//   const page = await browser.newPage()
//   console.log(`Open tab: ${Date.now() - t1}ms`)

//   page.on('console', msg => console.log(msg.text()))
//   // const t2 = Date.now()
//   // let t5
//   // const result = await new Promise(async (resolve, reject) => {
//   //   const t3 = Date.now()
//   //   await page.exposeFunction(TESTS_METADATA, resolve)
//   //   console.log(`Expose: ${Date.now() - t3}ms`)

//   //   t5 = Date.now()
//   //   const t4 = Date.now()
//   //   await page.evaluate(file)
//   //   console.log(`Evaluate: ${Date.now() - t4}ms`)

//   // })
//   // console.log(`Resolve: ${Date.now() - t5}ms`)
//   // console.log(`Expose + evaluate + expose resolve: ${Date.now() - t2}ms`)

//   // const t8 = Date.now()
//   // await page.reload()
//   // console.log(`Reload: ${Date.now() - t8}ms`)

//   // const t9 = Date.now()
//   // await page.evaluateOnNewDocument(file)
//   // console.log(`EvalOnNewDoc: ${Date.now() - t9}ms`)

//   // const t10 = Date.now()
//   // await page.reload()
//   // console.log(`Reload with EvalOnNewDoc: ${Date.now() - t10}ms`)

//   // const t11 = Date.now()
//   // let t12
//   // const result2 = await new Promise(async (resolve, reject) => {
//   //   const t13 = Date.now()
//   //   await page.exposeFunction(TESTS_METADATA, resolve)
//   //   console.log(`Expose: ${Date.now() - t13}ms`)

//   //   t12 = Date.now()
//   //   const t14 = Date.now()
//   //   await page.reload()
//   //   console.log(`Reload: ${Date.now() - t14}ms`)

//   // })
//   // console.log(`Resolve: ${Date.now() - t12}ms`)
//   // console.log(`Expose + reload + expose resolve: ${Date.now() - t11}ms`)
  
//   // const t7 = Date.now()
//   // await page.evaluate('1 + 2')
//   // console.log(`Test eval: ${Date.now() - t7}ms`)

//   // const t4 = Date.now()
//   // // await page.evaluate(file)
//   // await page.setContent(`
//   // <!DOCTYPE html>
//   // <script src=".epk\dist\asserts.spec.js"></script>
//   // `)
//   // console.log(`Evaluate: ${Date.now() - t4}ms`)

//   const t11 = Date.now()
//   let t12
//   const result2 = await new Promise(async (resolve, reject) => {
//     try {
//       const t13 = Date.now()
//       await page.exposeFunction(TESTS_METADATA, resolve)
//       console.log(`Expose: ${Date.now() - t13}ms`)
  
//       t12 = Date.now()
//       const t14 = Date.now()
//       // await page.goto(`data:text/html,<!DOCTYPE html><script>${file}</script>`)
//       await page.setContent(`<!DOCTYPE html><script>${file}</script>`)
//       // await page.evaluate(file)
//       console.log(`goto: ${Date.now() - t14}ms`)
//     } catch (err) {
//       reject(err)
//     }
//   })
//   console.log(`Resolve: ${Date.now() - t12}ms`)
//   console.log(`Expose + goto + expose resolve: ${Date.now() - t11}ms`)

//   // const t14 = Date.now()
//   // await page.reload()
//   // console.log(`Reload: ${Date.now() - t14}ms`)

//   // const t9 = Date.now()
//   // // await page.evaluate(file)
//   // await page.setContent(`
//   // <!DOCTYPE html>
//   // <script src=".epk\dist\\test.spec.js"></script>
//   // `)
//   // console.log(`Evaluate2: ${Date.now() - t9}ms`)

//   const t6 = Date.now()
//   await page.close()
//   console.log(`Close: ${Date.now() - t6}ms`)
//   console.log(`Full: ${Date.now() - t}ms`)
//   // return result
// })()


// draftlog.into(console)//.addLineListener(process.stdin)

// const t = console.draft()

// const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

// const log = (textFunction, operator) =>
//   switchMap(value =>
//     Observable.create(observer => {
//       let completed
//       const updateLine = console.draft()
//       const t1 = Date.now()
//       const observable =
//         of(value)
//           .pipe(
//             take(1),
//             operator,
//             publish()
//           )
//       const sub = observable.subscribe(val => {
//         completed = true
//         updateLine(
//           textFunction({
//             icon: '✔',
//             time: prettifyTime(Date.now() - t1),
//             done: true,
//             value
//           })
//         )
//         observer.next(val)
//       })
//       const spinnerSub =
//         timer(0, 100)
//           .pipe(
//             takeUntil(observable),
//           )
//           .subscribe(i =>
//             updateLine(
//               textFunction({
//                 icon: frames[i % frames.length],
//                 running: true,
//                 value
//               })
//             ))
//       observable.connect()
//       return _ => {
//         if (completed) return
//         sub.unsubscribe()
//         spinnerSub.unsubscribe()
//         updateLine(
//           textFunction({
//             icon: '✖',
//             cancelled: true,
//             value
//           })
//         )
//       }
//     }))

// timer(0, 1000)
//   .pipe(
//     log(
//       ({ icon, time, cancelled, error, done, value }) =>
//         done ? `${icon} Done in ${time}.`
//         : error ? `${icon} Error: ${error}.`
//         : cancelled ? `${icon} Cancelled.`
//         : `${icon} Processing ${value}...`,
//       switchMap(_ => timer((((Math.random() * (6 - 4)) + 4) * 100))))
//   )
//   .subscribe(val => {
//     t(val)
//   })
