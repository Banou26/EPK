import { map, tap } from 'rxjs/operators'

import install from '../utils/install.ts'

export default async (taskSubject) => {
  const puppeteer = await install(['puppeteer'], __filename)

  return (
    taskSubject
    |> map(task => ({ task }))
  )
}
