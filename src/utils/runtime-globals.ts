
export type Global = 'messages' | 'sendMessage'

export const toGlobal = (globalVariableName: Global) => `__epk_${globalVariableName}__`
