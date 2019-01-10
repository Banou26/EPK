// import draftlog from 'draftlog'
import { Observable, timer, of } from 'rxjs'
import { takeUntil, switchMap, take, publish } from 'rxjs/operators'

export const prettifyTime = time =>
  time < 1000
    ? `${time.toFixed()}ms`
    : `${(time / 1000).toFixed(2)}s`


// draftlog.into(console)

export const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
export const getFrame =
  i =>
    frames[i % frames.length]
export const check = '✔'
export const x = '✖'


export const log = (textFunction, operator) =>
  switchMap(value =>
    Observable.create(observer => {
      let completed
      const updateLine = console.draft()
      const t1 = Date.now()
      const observable =
        of(value)
          .pipe(
            operator,
            publish()
          )
      const obs = observable.refCount()
      const sub = obs.subscribe(val => {
        completed = true
        updateLine(
          textFunction({
            time: prettifyTime(Date.now() - t1),
            done: true,
            value
          })
        )
        observer.next(val)
      })
      const spinnerSub =
        timer(0, 100)
          .pipe(
            takeUntil(obs),
          )
          .subscribe(i =>
            updateLine(
              textFunction({
                icon: frames[i % frames.length],
                running: true,
                value,
                i
              })
            ))
      observable.connect()
      return _ => {
        if (completed) return
        sub.unsubscribe()
        spinnerSub.unsubscribe()
        updateLine(
          textFunction({
            cancelled: true,
            value
          })
        )
      }
    }))