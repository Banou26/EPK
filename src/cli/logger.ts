// from https://github.com/parcel-bundler/parcel/tree/master/packages/core/logger/src

import Chalk from 'chalk'
import readline from 'readline'
import { countBreaks } from 'grapheme-breaker'
import stripAnsi from 'strip-ansi'
import ora from 'ora'
import path from 'path'
import fs from 'fs'

const prettyError = (err, { color } = { color: undefined }) => {
  let message = typeof err === 'string' ? err : err.message
  if (!message) message = 'Unknown error'

  if (err.fileName) {
    let fileName = err.fileName
    if (err.loc) {
      fileName += `:${err.loc.line}:${err.loc.column}`
    }

    message = `${fileName}: ${message}`
  }

  let stack
  if (err.codeFrame) {
    stack = (color && err.highlightedCodeFrame) || err.codeFrame
  } else if (err.stack) {
    stack = err.stack.slice(err.stack.indexOf('\n') + 1)
  }

  return {
    message, stack
  }
}

const supportsEmoji =
  process.platform !== 'win32' || process.env.TERM === 'xterm-256color'

// Fallback symbols for Windows from https://en.wikipedia.org/wiki/Code_page_437
const defaultEmojis = {
  progress: supportsEmoji ? '⏳' : '∞',
  success: supportsEmoji ? '✨' : '√',
  error: supportsEmoji ? '🚨' : '×',
  warning: supportsEmoji ? '⚠️' : '‼'
}

const countLines = str =>
  stripAnsi(str)
    .split('\n')
    .reduce((p, line) =>
      process.stdout.columns
        ? p + Math.ceil((line.length || 1) / process.stdout.columns)
        : p + 1)

// Pad a string with spaces on either side
const pad = (text, length, align = 'left') => {
  const pad = ' '.repeat(length - stringWidth(text))
  if (align === 'right') return `${pad}${text}`
  return `${text}${pad}`
}

// Count visible characters in a string
const stringWidth = str =>
  // @ts-ignore
  `${str}`
  // @ts-ignore
  |> stripAnsi
  // @ts-ignore
  |> countBreaks

const Logger = ({
  logLevel = 3,
  color = Chalk.supportsColor,
  emojis = defaultEmojis,
  chalk = new Chalk.constructor({ enabled: color }),
  isTest = process.env.NODE_ENV === 'test'
} = {}) => {
  let lines = 0
  let spinner
  let logFile

  const writeRaw = str => {
    stopSpinner()
    lines += countLines(str) - 1
    process.stdout.write(str)
  }

  const write = (message, persistent = false) => {
    if (logLevel > 3) {
      return verbose(message)
    }

    if (!persistent) {
      lines += countLines(message)
    }

    stopSpinner()
    _log(message)
  }

  const verbose = str => {
    if (logLevel < 4) return
    let currDate = new Date()
    str = `[${currDate.toLocaleTimeString()}]: ${str}`
    if (logLevel > 4) {
      if (!logFile) {
        logFile = fs.createWriteStream(
          path.join(process.cwd(), `parcel-debug-${currDate.toISOString()}.log`)
        )
      }
      logFile.write(stripAnsi(str) + '\n')
    }
    _log(str)
  }

  const log = str =>
    logLevel >= 3 &&
    write(str)

  const persistent = str =>
    logLevel >= 3 &&
    write(chalk.bold(str), true)

  const warn = err =>
    logLevel >= 2 &&
    _writeError(err, emojis.warning, chalk.yellow)

  const error = err =>
    logLevel >= 1 &&
    _writeError(err, emojis.error, chalk.red.bold)

  const success = str =>
    log(`${emojis.success}  ${chalk.green.bold(str)}`)

  const formatError = (err, options) => prettyError(err, options)

  const _writeError = (err, emoji, _color) => {
    const { message, stack } = formatError(err, { color })
    write(_color(`${emoji}  ${message}`))
    if (stack) write(stack)
  }

  const clear = () => {
    if (!color || isTest || logLevel > 3) return

    while (lines > 0) {
      readline.clearLine(process.stdout, 0)
      readline.moveCursor(process.stdout, 0, -1)
      lines--
    }

    readline.cursorTo(process.stdout, 0)
    stopSpinner()
  }

  const progress = str => {
    if (logLevel < 3) return
    else if (logLevel > 3) return verbose(str)

    const styledMessage = chalk.gray.bold(str)
    if (!spinner) {
      spinner = ora({
        text: styledMessage,
        stream: process.stdout,
        enabled: isTest ? false : undefined // fall back to ora default unless we need to explicitly disable it.
      }).start()
    } else spinner.text = styledMessage
  }

  const stopSpinner = () => {
    if (spinner) {
      spinner.stop()
      spinner = null
    }
  }

  const _log = str => console.log(str)

  const table = (columns, table) => {
    // Measure column widths
    let colWidths = []
    for (let row of table) {
      let i = 0
      for (let item of row) {
        colWidths[i] = Math.max(colWidths[i] || 0, stringWidth(item))
        i++
      }
    }

    // Render rows
    for (let row of table) {
      log(
        row.map((item, i) => {
          // Add padding between columns unless the alignment is the opposite to the
          // next column and pad to the column width.
          let padding =
            !columns[i + 1] || columns[i + 1].align === columns[i].align ? 4 : 0
          return pad(item, colWidths[i] + padding, columns[i].align)
        })
        .join('')
      )
    }
  }

  const logger = {
    writeRaw,
    write,
    verbose,
    log,
    persistent,
    warn,
    error,
    success,
    formatError,
    _writeError,
    clear,
    progress,
    stopSpinner,
    _log,
    table,
    handleMessage: undefined,
  }

  const handleMessage = ({ method, args }) => logger[method](...args)
  logger.handleMessage = handleMessage

  return logger
}

export default Logger()
