import path from 'path'

import 'v8-compile-cache'
import getPort from 'get-port'
import program from 'commander'
import chalk from 'chalk'
import { render } from 'ink'

import pkg from '../../package.json'
import Tester from '../core/index.ts'
import CLIReporter from '../reporters/cli/index.tsx'
import Server from '../server/index.ts'
import { tap, take, shareReplay, filter } from 'rxjs/operators'
import { Subject } from 'rxjs'
import { REPORTER_EVENT } from '../types.ts'

process.on('unhandledRejection', error => {
  console.error(error)
  process.exit(1)
})

program.version(pkg.version)

const commonOptions = {
  '--no-cache': 'disable the filesystem cache',
  '--cache-dir <path>': 'set the cache directory. defaults to ".parcel-cache"',
  '--no-source-maps': 'disable sourcemaps',
  '--no-autoinstall': 'disable autoinstall',
  '--public-url <url>': 'set the public URL to serve on. defaults to "/"',
  '--log-level <level>': [
    'set the log level, either "none", "error", "warn", "info", or "verbose".',
    /^(none|error|warn|info|verbose)$/
  ],
  '-T, --target': [
    'target for the test, either "browser" or "node"',
    /^(browser|node)$/
  ],
  '-V, --version': 'output the version number'
}

program
  .command('help [command]')
  .description('display help information for a command')
  .action(command =>
    (
      program
        .commands
        .find(c =>
          c.name() === command) ||
      program)
      .help())

program.on('--help', function() {
  console.log('')
  console.log(`  Run \`${chalk.bold('epk help <command>')}\` for more information on specific commands`)
  console.log('')
})

const run = async (entries: Array<string>, command: any) => {
  entries = entries.map(entry => path.resolve(entry))

  if (entries.length === 0) return console.log('No entries found')

  const subject = new Subject()

  CLIReporter(
    // @ts-ignore
    subject
    // @ts-ignore
    |> filter(({ type }) => type === REPORTER_EVENT.STATE)
  )

  await new Promise(resolve => setTimeout(resolve, 0))
  subject.next({ type: REPORTER_EVENT.PORT_SEARCH })
  const port = await getPort({ port: command.port || 10485 })
  subject.next({ type: REPORTER_EVENT.PORT_FOUND, port })

  // @ts-ignore
  const serverObservable = Server({ port }) |> shareReplay(1)
  subject.next({ type: REPORTER_EVENT.WEB_SERVER_START })
  serverObservable.subscribe()

  // @ts-ignore
  await (serverObservable |> take(1)).toPromise()
  subject.next({ type: REPORTER_EVENT.WEB_SERVER_READY, port })

  const testerObservable =
    // @ts-ignore
    Tester(({
      entryFiles: entries,
      watch: command.watch,
      target: command.target,
      port
    }))

  // @ts-ignore
  testerObservable.subscribe(
    report => subject.next(report),
    error => {
      subject.error(error)
      process.exit(1)
    },
    () => subject.complete())
}

const watch = program
  .command('watch [input...]')
  .description('starts the tester in watch mode')
  .action(run)

applyOptions(watch, commonOptions)

const test = program
  .command('test [input...]')
  .description('test once')
  .action(run)

applyOptions(test, commonOptions)

function applyOptions(cmd, options) {
  for (let opt in options) {
    cmd.option(
      opt,
      ...(Array.isArray(options[opt]) ? options[opt] : [options[opt]])
    )
  }
}

// Make watch the default command except for --help
let args = process.argv
if (args[2] === '--help' || args[2] === '-h') args[2] = 'help'
if (!args[2] || !program.commands.some(c => c.name() === args[2])) {
  args.splice(2, 0, 'watch')
}
program.parse(args)
