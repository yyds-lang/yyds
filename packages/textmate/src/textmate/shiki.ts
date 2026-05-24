import { YYDS_SCOPE_NAME, yydsGrammar } from './grammar.ts'

export interface ShikiLanguageDefinition {
  id: string
  scopeName: string
  grammar: unknown
}

export function toShikiLanguageDefinition(id = 'yyds'): ShikiLanguageDefinition {
  return {
    id,
    scopeName: YYDS_SCOPE_NAME,
    grammar: yydsGrammar
  }
}
