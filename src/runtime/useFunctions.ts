import type { UseEvaluate } from './test'

export const runInUrls: UseEvaluate = async ({ getPage, run, prepareContext }, [urls]) => {
  const results = await Promise.all(
    urls.map(async url => {
      const { page, tabId, backgroundPage } = await getPage()
      await page.goto(url)
      await prepareContext({ page, tabId, backgroundPage })
      return await run({ page, tabId, backgroundPage }, { data: { url } }).finally(() => page.close())
    })
  )
  const failedResults = results.filter(({ tests }) => tests.some(test => test.status !== 'success'))
  if (failedResults.length) return failedResults[0]
  return results[0]
}

export const withData: UseEvaluate = async ({ getPage, run, prepareContext }, dataArray) => {
  const { page, tabId, backgroundPage } = await getPage()
  await prepareContext({ page, tabId, backgroundPage })
  const results = await Promise.all(
    dataArray.map(data => run({ page, tabId, backgroundPage }, { data }))
  )
  const failedResults = results.filter(({ tests }) => tests.some(test => test.status !== 'success'))
  if (failedResults.length) return failedResults[0]
  return results[0]
}
