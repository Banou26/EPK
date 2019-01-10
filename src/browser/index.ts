// import { fromEvent, of } from 'rxjs'
// import { map, switchMap, mergeMap } from 'rxjs/operators'
// import iframe from './iframe.ts'

// fromEvent(window, 'message')
//   .pipe(
//     map(({ data }) =>
//       JSON.stringify(data)),
//     switchMap(bundles =>
//       of(bundles)
//         .pipe(
//           mergeMap(bundle =>
//             iframe(bundle))
//         ))
//   ).subscribe(res => {
//     console.log(res)
//   })


const iframe = document.createElement('iframe')
iframe.src = './index.html?test'
document.body.appendChild(iframe)
