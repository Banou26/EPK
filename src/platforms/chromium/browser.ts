import type { BrowserContext, BrowserType } from 'playwright'
import { TestConfig } from 'src/types'
import { Extension } from './types'

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

export const getExtensions = async ({ config, context }: { config: TestConfig, context: BrowserContext }): Promise<Extension[]> => {
  const extensionPage = await context.newPage()
  await extensionPage.goto('chrome://extensions/')
  await extensionPage.reload()
  const cardElemHandles = await extensionPage.locator('#card').elementHandles()
  // const elemHandles = await extensionPage.locator('#extension-id:below(div#name, 200)').elementHandles()
  const extensions = await Promise.all(
    (await cardElemHandles)
      .map(async cardElemHandle => {
        // this is needed for certain extensions as there's a weird bug cutting internet connection to background pages
        // other weird stuff happens with background pages, e.g can't run anything when clicking on background page in the extensions page on initial load
        if (config.initReloadExtensions) await (await cardElemHandle.waitForSelector('#dev-reload-button')).click()
        return {
          name: await (await cardElemHandle.waitForSelector('#name')).innerText(),
          id: (await (await cardElemHandle.waitForSelector('#extension-id:below(div#name, 200)')).innerText()).replace('ID: ', '')
        }
      })
  )
  await extensionPage.close()
  return extensions
}
