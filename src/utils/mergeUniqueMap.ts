import { mergeScan } from 'rxjs/operators';
import { of } from 'rxjs';

export default
  observable =>
    mergeScan(([map], [key, value]) => {
      map.set()
      return of([])
    }, [new Map()])
