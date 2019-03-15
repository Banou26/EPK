// https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/utils/localRequire.js
import { dirname } from 'path'
import utils from '@parcel/utils'
import Resolve from 'resolve'
import installPackage from './installPackage'
import getModuleParts from './getModuleParts'

const { promisify } = utils
const _resolve = promisify(Resolve)

const cache = new Map();

export const localRequire = async (name, path, triedInstall = false) => {
  const [resolved] = await resolve(name, path, triedInstall)
  return require(resolved)
}

export const resolve = async (name, path, triedInstall = false) => {
  let basedir = dirname(path)
  let key = basedir + ':' + name
  let resolved = cache.get(key)
  if (!resolved) {
    try {
      resolved = await _resolve(name, {basedir})
    } catch (e) {
      if (e.code === 'MODULE_NOT_FOUND' && !triedInstall) {
        const packageName = getModuleParts(name)[0]
        await installPackage(packageName, path)
        return resolve(name, path, true)
      }
      throw e
    }
    cache.set(key, resolved)
  }
  return resolved
}

export default async (packages, path = __filename) =>
  typeof packages === 'string'
    ? localRequire(packages, path)
    : Promise.all(packages.map(pkg => localRequire(pkg, path)))
