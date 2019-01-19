import { Observable, fromEvent } from 'rxjs'
import { take, map } from 'rxjs/operators'

export default (url: string): Observable<HTMLIFrameElement> =>
  Observable.create(observer => {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    iframe.onload = _ => {
      const script = document.createElement('script')
      script.onload = _ => observer.next(iframe)
      iframe.contentWindow.document.head.appendChild(script)
      script.src = url
    }
    iframe.src = '/epk/empty.html'
    return _ => iframe.remove()
  })

// export default (url: string): Observable<HTMLIFrameElement> =>
//   Observable.create(observer => {
//     const w = window.open()
//     w.opener = null;
//     w.document.location = '/epk/empty.html'
//     w.onload = _ => {
//       const script = document.createElement('script')
//       script.onload = _ => observer.next(iframe)
//       iframe.contentWindow.document.head.appendChild(script)
//       script.src = url
//     }
//     return _ => w.close()
//   })


