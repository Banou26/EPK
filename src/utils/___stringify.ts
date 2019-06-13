export default (strings, ...vals) =>
  strings.reduce((finalStr, str, i) =>
    `${
      finalStr
    }${
      str
    }${
      vals.length > i
        ? JSON.stringify(vals[i])
        : ''
    }`, '')