import { tap, scan } from 'rxjs/operators'
import { Context } from '../types'
import chalk from 'chalk'
import logger from './logger'

  // |> tap(({ entryFiles  }: Context) => {
  //   logger.clear()
  //   logger.progress(`\n${chalk.grey(`Building ${entryFiles.map(prettifyPath).join(', ')}`)}`)
  // })

export default
  options =>
    scan((state, val: File|Context) => {
      if (val.name === 'buildStart') {
        logger.clear()
        logger.progress(`\n${chalk.grey(`Bundling...`)}`)
        return {}
      } else if (val.name === 'bundled') {
        logger.progress(`\n${chalk.grey(`Bundled`)}`)
        return state
      }
      logger.progress(`\n${chalk.grey(`...`)}`)
      return {
        ...state,
        ...val
      }
    }, {})
    
    // {
    //   let context

    //   // @ts-ignore
    //   return tester
    //           // @ts-ignore
    //           |> tap(val => {

    //           })
    // }
