import type { BrowserContext, BrowserType } from 'playwright'

export const createContext = async ({ userDataDir, options }: { userDataDir: string, options?: Parameters<BrowserType<{}>['launchPersistentContext']>[1] }) => {
  const playwright = await import('playwright')
  const context = playwright.chromium.launchPersistentContext(userDataDir, options)
  return context
}

export const enableExtension = async ({ context, extensionName }: { context: BrowserContext, extensionName: string }) => {
  await context.waitForEvent('backgroundpage')
  const extensionPage = await context.newPage()
  await extensionPage.goto('chrome://extensions/')
  await extensionPage.click('#devMode')
  await extensionPage.reload()
  const extensionId = (await (await extensionPage.waitForSelector(`#extension-id:below(div#name:has-text("${extensionName}"), 200)`, { state: 'attached' })).textContent())?.replace('ID: ', '')
  await extensionPage.goto(`chrome://extensions/?id=${extensionId}`)
  await extensionPage.click('#allow-incognito #knob')
  await extensionPage.selectOption('#hostAccess', 'ON_ALL_SITES')
  // await extensionPage.click('#inspect-views > li:nth-child(2) > a')
  await extensionPage.close()
  return extensionId
}
