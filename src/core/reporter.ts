import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

import { BuildOutput } from './esbuild'

type ReporterEvents = BuildOutput

export default () =>
  (events: Observable<ReporterEvents>) =>
    events
      .pipe(
        tap(v => console.log('REPORTER', v))
      )
