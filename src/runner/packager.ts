import JSPackager from 'parcel-bundler/src/packagers/JSPackager'
import espower  from 'espower'
import esprima  from 'esprima'
import escodegen  from 'escodegen'

export default class SteinsGatePackager extends JSPackager {
  async addAsset(asset) {
    await this.dest.write(asset.generated.js)
    // if (asset.name.includes('C:\\Users\\Banou\\Desktop\\steins-gate\\tests\\unit\\asserts.spec.ts')) {
    //   // const a = espowerSource(asset.generated.js, asset.name)
    //   var jsAst = esprima.parse(asset.generated.js, {tolerant: true, loc: true, tokens: true});
    //   var modifiedAst = espower(jsAst, {sourceMap: asset.generated.map,path: asset.name, sourceRoot: __dirname});
    //   const a = escodegen.generate(modifiedAst)
    //   console.log('lull')
    //   await this.dest.write(a)
    // }
    // console.log('kk')
    // await this.dest.write(espowerSource(asset.generated.js, asset.name))
    // await this.dest.write(asset.generated.js)
    // required. write the asset to the output file.
    // await this.dest.write(asset.generated.foo)
    // console.log(asset.generated.js)
    // console.log(asset)
    // await this.dest.write(espowerSource(asset.generated.js, asset.name))
    // if (this.options.minify) {
    //   console.log("minify")
    //   const config = (await asset.parentBundle!.entryAsset.getConfig(
    //     ["purgecss.config.js"],
    //     { packageKey: "purgecss" }
    //   )) as PurgeCSS.Options

    //   if (config) {
    //     console.log("config")
    //     asset.generated!.css = new PurgeCSS({
    //       ...config,
    //       css: [{ extension: "css", raw: asset.generated!.css }]
    //     }).purge()[0].css
    //   }
    // }

    return super.addAsset(asset)
  }
}