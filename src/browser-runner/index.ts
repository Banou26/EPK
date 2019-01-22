import { fromEvent, from, of, forkJoin, isObservable, Observable } from 'rxjs'
import { map, switchMap, mergeMap, take, zip, bufferCount, tap, filter, delay } from 'rxjs/operators'
import iframe from './iframe'
import { GET_TESTS, RUN_TESTS, RUN_TEST } from '../utils'
import { Test, TestResult } from '../types'

// const getTests =
//   (urls: string[]): Promise<Test[]> =>
//     (forkJoin(
//       urls.map(url =>
//         iframe(`${url}`)
//           |> switchMap(async iframe =>
//               (await iframe.contentWindow[GET_TESTS]())
//                 .map(([ description, body ]: [ string, string ]) => ({
//                   url,
//                   description,
//                   body
//                 })))
//           |> take(1))
//     )
//       |> map(tests => tests.flat()))
//       .toPromise()

// const runTests =
//   (tests: Test[]): Promise<TestResult> =>
//     (forkJoin(
//       tests.map(({ url, description, body }: { url: string, description: string, body: string }) =>
//         iframe(`${url}?${description}`)
//           |> switchMap(async (iframe: HTMLIFrameElement): TestResult => ({
//             url,
//             description,
//             body,
//             ...await iframe.contentWindow[RUN_TEST](description)
//               .then(value => ({ value }))
//               .catch(error => ({ error }))
//           }))
//           |> take(1))
//     )
//       |> map(tests => tests.flat()))
//       .toPromise()

const getTests =
  (filesData): Promise<Test[]> =>
    // @ts-ignore
    ((forkJoin(
      ...filesData.map(({ sourcePath, distPath, url }) =>
      // @ts-ignore
        iframe(`${url}`)
        // @ts-ignore
        |> tap((iframe: HTMLIFrameElement) =>
            iframe.contentWindow.postMessage({
              name: GET_TESTS
            }, '*'))
          // @ts-ignore
        |> switchMap(iframe =>
            // @ts-ignore
            fromEvent(window, 'message')
            // @ts-ignore
            |> filter(({ source }) => source === iframe.contentWindow)
            // @ts-ignore
            |> map(({ data }) => data)
            // @ts-ignore
            |> map(({ data: testsData }) =>
                testsData
                  .map(([ description, body ]: [ string, string ]) => ({
                    sourcePath,
                    distPath,
                    url,
                    description,
                    body
                  }))))
        // @ts-ignore
        |> take(1))
    )
      // @ts-ignore
      |> map(tests => tests.flat())) as Observable)
      .toPromise()

const runTests =
  (tests: Test[]): Promise<TestResult> =>
    // @ts-ignore
    ((forkJoin(
      // @ts-ignore
      ...tests.map(({ sourcePath, distPath, url, description, body }: { url: string, description: string, body: string }) =>
        // @ts-ignore
        iframe(`${url}?${description}`)
        // @ts-ignore
        |> tap((iframe: HTMLIFrameElement) =>
            iframe.contentWindow.postMessage({
              name: RUN_TEST,
              data: description
            }, '*'))
        // @ts-ignore
        |> switchMap(iframe =>
            // @ts-ignore
            fromEvent(window, 'message')
            // @ts-ignore
            |> filter(({ source }) => source === iframe.contentWindow)
            // @ts-ignore
            |> map(({ data }) => data)
            // @ts-ignore
            |> map(({ data: { error } }) => ({
                sourcePath,
                distPath,
                url,
                description,
                body,
                error
              }))
            /*|> delay(10000)*/)
        // @ts-ignore
        |> take(1))
    )
    // @ts-ignore
    |> map(tests => tests.flat())) as Observable)
      .toPromise()

window[GET_TESTS] = getTests
window[RUN_TESTS] = runTests