export const runInUrls = async ({ getPage, run, prepareContext }, [urls]) => {
  const results = await Promise.all(
    urls.map(async url => {
      const { page, tabId, backgroundPage } = await getPage()
      await page.goto(url)
      await prepareContext({ page, tabId, backgroundPage })
      return await run({ page, tabId, backgroundPage }, { data: { url } })
    })
  )
  const failedResults = results.filter(({ tests }) => tests.some(test => test.status !== 'success'))
  if (failedResults.length) return failedResults[0]
  return results[0]
}
