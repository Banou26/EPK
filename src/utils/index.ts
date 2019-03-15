import Path from 'path'

export const prettifyPath = path => Path.relative(process.cwd(), path)

export const transformPathToTestUrl = (path, port) => `${port ? `http://localhost:${port}` : ''}${path.replace(`${Path.resolve(process.cwd(), '.epk', 'dist')}\\`, '/tests/').replace('\\', '/')}`
export const transformPathToEpkUrl = (path, port) => `${port ? `http://localhost:${port}` : ''}${path.replace(`${Path.resolve(process.cwd(), 'dist')}\\`, '/epk/').replace('\\', '/')}`
