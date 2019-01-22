import program from 'commander'
import chalk from 'chalk'

export default (): string[] =>
  new Promise((resolve, reject) => {
    program
      .command('serve [input...]')
      .description('starts a development server')
      .action(resolve)

    program
      .command('help [command]')
      .description('display help information for a command')
      .action(function(command) {
        let cmd = program.commands.find(c => c.name() === command) || program
        cmd.help()
      })

    program.on('--help', function() {
      console.log('')
      console.log(
        '  Run `' +
          chalk.bold('epk help <command>') +
          '` for more information on specific commands'
      )
      console.log('')
    })

    // Make serve the default command except for --help
    const args = process.argv
    if (args[2] === '--help' || args[2] === '-h') args[2] = 'help'
    if (!args[2] || !program.commands.some(c => c.name() === args[2])) {
      args.splice(2, 0, 'serve')
    }

    program.parse(args)
  }) as any