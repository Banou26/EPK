import path from 'path'

export const prettifyPath = _path => path.relative(process.cwd(), _path)

export const getEmptyPageUrl = port =>
  transformPathToEpkUrl(path.resolve(__dirname, '..', 'dist', 'empty.html'), port)

export const transformPathToTestUrl = (_path, port) =>
  `${port ? `http://localhost:${port}` : ''}${_path.replace(`${path.resolve(process.cwd(), '.epk', 'dist')}\\`, '/tests/').replace('\\', '/')}`

export const transformPathToEpkUrl = (_path, port) =>
  `${port ? `http://localhost:${port}` : ''}${_path.replace(`${path.resolve(__dirname, '..', 'dist')}\\`, '/epk/').replace('\\', '/')}`
