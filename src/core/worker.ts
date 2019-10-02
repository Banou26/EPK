import { Subject } from 'rxjs'
import { Worker } from 'worker_threads'

export default ({ url = './worker.js' }) => {
  const worker = new Worker(url)

  return (generateTask: () => Observable<Task>) =>
    from(worker, 'message')
    |> generateTask
}
