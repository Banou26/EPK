import { Subject } from 'rxjs'

export default ({ url = './worker.js' }) => {
  const worker = new Worker(url)

  return (generateTask: () => Observable<Task>) =>
    from(worker, 'message')
    |> generateTask
}
