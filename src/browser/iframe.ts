import { Observable, fromEvent } from 'rxjs'
import { take, map } from 'rxjs/operators'

export default ({ url, metadata = false, functionBody }) =>
  Observable.create(observer => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    const sub =
      fromEvent(iframe, 'message')
        .pipe(
          take(1),
          map(({data }) =>
            JSON.stringify(data))
        )
        .subscribe(res => {
          observer.next(res)
        })

    iframe.onload = _ =>
      iframe.contentWindow.postMessage({ metadata, functionBody }, '*')

    iframe.src = url

    return _ => {
      iframe.remove()
      sub.unsubscribe()
    }
  })