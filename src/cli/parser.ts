import program from 'commander'
import chalk from 'chalk'

const helpMessage = `
Run \`${chalk.bold('epk help <command>')}\` for more information on specific commands
`

const list = v => v.split(',')

export let action, args

program
  .command('serve [input...]')
  .description('starts a development server')
  .option('-d, --out-dir path', 'Output directory')
  .option('-t, --target [target]', 'Set parcel target to [node, browser, electron]', undefined, 'browser')
  .option('-b, --browsers [target]', 'Set parcel target to [chrome, firefox]', list, ['chrome'])
  .action(_args => {
    action = 'serve'
    args = _args
  })

program
  .command('help [command]')
  .description('display help information for a command')
  .action(command =>
    (program
        .commands
        .find(c =>
          c.name() === command) ||
    program).help())

program.on('--help', _ => console.log(helpMessage))

// Make serve the default command except for --help
const _args = process.argv
if (_args[2] === '--help' || _args[2] === '-h') _args[2] = 'help'
if (!_args[2] || !program.commands.some(c => c.name() === _args[2])) {
  _args.splice(2, 0, 'serve')
}

export const command = program.parse(_args)
export const options = program.opts()
