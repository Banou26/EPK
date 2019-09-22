// import 'v8-compile-cache'
// import EPK from '../core/index.ts'
// import program from 'commander'

// import pkg from '../../package.json'

// console.log('.')
// process.on('unhandledRejection', error => {
//   console.error(error)
//   process.exit(1)
// })

// program.version(pkg.version)

// const run = (entries: Array<string>, command: any) => {
//   console.log('kkkk', entries, command)
// }

// const watch = program
//   .command('watch [input...]')
//   .description('starts the tester in watch mode')
//   .action(run)

// console.log(process.argv)
// Make watch the default command except for --help
// let args = process.argv
// if (args[2] === '--help' || args[2] === '-h') args[2] = 'help'
// if (!args[2] || !program.commands.some(c => c.name() === args[2])) {
//   args.splice(2, 0, 'watch')
// }

// console.log(process.argv)
// program.parse(process.argv)
// console.log('foo')

// const run = (entryFiles) => {
//   const epk = EPK({
//     entryFiles
//   })

//   epk.subscribe(v => console.log(v))
// }

// run()
console.log('foo')
