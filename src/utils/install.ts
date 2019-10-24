import { NodePackageManager, Yarn } from '@parcel/package-manager'
import { NodeFS } from '@parcel/fs'

const fs = new NodeFS()
const pkgInstaller = new Yarn()
const npm = new NodePackageManager(fs, pkgInstaller)

export default (...args) => npm.install(...args)