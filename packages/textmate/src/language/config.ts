export interface YydsLanguageConfiguration {
  comments: {
    lineComment: string
    blockComment: [string, string]
  }
  brackets: [string, string][]
  autoClosingPairs: { open: string; close: string }[]
  surroundingPairs: [string, string][]
}

export const yydsLanguageConfiguration: YydsLanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['(', ')'],
    ['[', ']']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '"', close: '"' }
  ],
  surroundingPairs: [
    ['{', '}'],
    ['(', ')'],
    ['[', ']'],
    ['"', '"']
  ]
}
