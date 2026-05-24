import { YYDS_KEYWORDS } from './keywords.ts'

export const YYDS_SCOPE_NAME = 'source.yyds'
const keywordPattern = `\\b(${YYDS_KEYWORDS.join('|')})\\b`

export const yydsGrammar = {
  scopeName: YYDS_SCOPE_NAME,
  name: 'YYDS',
  patterns: [
    { include: '#comments' },
    { include: '#keywords' },
    { include: '#strings' },
    { include: '#numbers' },
    { include: '#notes' },
    { include: '#duration' },
    { include: '#operators' }
  ],
  repository: {
    comments: {
      patterns: [{ name: 'comment.line.double-slash.yyds', match: '//.*$' }]
    },
    keywords: {
      patterns: [
        {
          name: 'keyword.control.yyds',
          match: keywordPattern
        }
      ]
    },
    strings: {
      patterns: [{ name: 'string.quoted.double.yyds', begin: '"', end: '"' }]
    },
    numbers: {
      patterns: [{ name: 'constant.numeric.yyds', match: '\\b\\d+(?:\\.\\d+)?\\b' }]
    },
    notes: {
      patterns: [
        { name: 'entity.name.note.yyds', match: '\\b[A-G](?:#|b)?\\d\\b' },
        { name: 'constant.language.rest.yyds', match: '\\b(?:R|__)\\b' }
      ]
    },
    duration: {
      patterns: [{ name: 'storage.type.duration.yyds', match: '\\/(w|h|q|e|s|\\d+)\\.?' }]
    },
    operators: {
      patterns: [{ name: 'keyword.operator.yyds', match: '\\||@|%|=|->|-' }]
    }
  }
} as const
