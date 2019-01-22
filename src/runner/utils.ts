import Path from 'path'

export const prettifyPath = path => Path.relative(process.cwd(), path)

export const prettifyTime = time =>
  time < 1000
    ? `${time.toFixed()}ms`
    : `${(time / 1000).toFixed(2)}s`
