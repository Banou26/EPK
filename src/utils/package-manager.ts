import { NodePackageManager} from '@parcel/package-manager'
import { NodeFS } from '@parcel/fs'

// const fs = new NodeFS()
// const pkgInstaller = new Yarn()
// const npm = new NodePackageManager(fs, pkgInstaller)

// export default (...args) => npm.install(...args)

const packageManager = new NodePackageManager(new NodeFS())

export const require = (...args) =>
  packageManager.require(...args)