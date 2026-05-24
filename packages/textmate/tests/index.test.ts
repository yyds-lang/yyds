import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { expect, test } from 'vite-plus/test'
import * as textmateExports from '../src/index.ts'
import {
  YYDS_KEYWORDS,
  YYDS_SCOPE_NAME,
  yydsGrammar,
  yydsLanguageConfiguration
} from '../src/index.ts'

const fixture = (...segments: string[]) =>
  resolve(fileURLToPath(new URL('../../../fixtures', import.meta.url)), ...segments)

test('textmate grammar exposes stable scope', () => {
  expect(YYDS_SCOPE_NAME).toBe('source.yyds')
  expect(yydsGrammar.scopeName).toBe('source.yyds')
})

test('textmate grammar keyword source is centralized', () => {
  const keywordPattern = yydsGrammar.repository.keywords.patterns[0]?.match ?? ''
  expect(keywordPattern).toContain('allow_unbalanced')
  expect(keywordPattern).toContain('transpose')
  expect(YYDS_KEYWORDS.length).toBeGreaterThan(10)
})

test('highlight regression: key tokens are covered', () => {
  const stringPattern = new RegExp(yydsGrammar.repository.strings.patterns[0]?.begin ?? '"')
  const numberPattern = new RegExp(yydsGrammar.repository.numbers.patterns[0]?.match ?? '\\d+')
  const lineCommentPattern = new RegExp(
    yydsGrammar.repository.comments.patterns[0]?.match ?? '//.*$'
  )
  const blockCommentBeginPattern = new RegExp(
    yydsGrammar.repository.comments.patterns[1]?.begin ?? '/\\*'
  )
  const blockCommentEndPattern = new RegExp(
    yydsGrammar.repository.comments.patterns[1]?.end ?? '\\*/'
  )
  const notePattern = new RegExp(
    yydsGrammar.repository.notes.patterns[0]?.match ?? '\\b[A-G]\\d\\b'
  )
  const durationPattern = new RegExp(yydsGrammar.repository.duration.patterns[0]?.match ?? '\\/q')
  const operatorPattern = new RegExp(yydsGrammar.repository.operators.patterns[0]?.match ?? '->')

  expect(stringPattern.test('"demo"')).toBe(true)
  expect(numberPattern.test('120')).toBe(true)
  expect(lineCommentPattern.test('// note')).toBe(true)
  expect(blockCommentBeginPattern.test('/* note */')).toBe(true)
  expect(blockCommentEndPattern.test('/* note */')).toBe(true)
  expect(notePattern.test('C#4')).toBe(true)
  expect(durationPattern.test('/q')).toBe(true)
  expect(operatorPattern.test('->')).toBe(true)
})

test('highlight regression against valid fixture', () => {
  const source = readFileSync(fixture('valid', 'basic-song.yyds'), 'utf8')
  const keywordPattern = new RegExp(
    yydsGrammar.repository.keywords.patterns[0]?.match ?? '\\btempo\\b'
  )
  const commentPattern = new RegExp(yydsGrammar.repository.comments.patterns[0]?.match ?? '//.*$')

  expect(keywordPattern.test(source)).toBe(true)
  expect(commentPattern.test(source)).toBe(false)
})

test('language configuration model has stable pairs', () => {
  expect(yydsLanguageConfiguration.comments.lineComment).toBe('//')
  expect(yydsLanguageConfiguration.brackets).toEqual(
    expect.arrayContaining([
      ['{', '}'],
      ['(', ')'],
      ['[', ']']
    ])
  )
})

test('comment grammar aligns with language configuration', () => {
  const lineCommentPattern = yydsGrammar.repository.comments.patterns[0]?.match ?? ''
  const blockCommentBegin = yydsGrammar.repository.comments.patterns[1]?.begin ?? ''
  const blockCommentEnd = yydsGrammar.repository.comments.patterns[1]?.end ?? ''
  expect(lineCommentPattern).toContain('//')
  expect(blockCommentBegin).toContain('/\\*')
  expect(blockCommentEnd).toContain('\\*/')
  expect(yydsLanguageConfiguration.comments.blockComment).toEqual(['/*', '*/'])
})

test('textmate exports remain tool-agnostic', () => {
  expect('toShikiLanguageDefinition' in textmateExports).toBe(false)
  expect('ShikiLanguageDefinition' in textmateExports).toBe(false)
})
