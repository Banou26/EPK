import program from 'commander'
import chalk from 'chalk'

const helpMessage = `
Run \`${chalk.bold('epk help <command>')}\` for more information on specific commands
`

export default (): Promise<string[]> =>
  new Promise((resolve, reject) => {
    program
      .command('serve [input...]')
      .description('starts a development server')
      .action(resolve)

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
    const args = process.argv
    if (args[2] === '--help' || args[2] === '-h') args[2] = 'help'
    if (!args[2] || !program.commands.some(c => c.name() === args[2])) {
      args.splice(2, 0, 'serve')
    }

    program.parse(args)
  })
  