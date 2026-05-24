import { init } from 'modern-monaco'

const DEFAULT_SOURCE = `yyds 2
song "Demo"
tempo 120
meter 4/4
key C
unit q

section main {
  track[piano] melody {
    | C4 D4 E4 F4 |
    | G4/h R/h |
  }
}

play main`

let monacoInstancePromise: ReturnType<typeof init> | null = null
let yydsRegistered = false

async function getMonaco() {
  if (!monacoInstancePromise) {
    monacoInstancePromise = init({
      defaultTheme: 'vitesse-dark'
    })
  }
  return monacoInstancePromise
}

function registerYyds(monaco: Awaited<ReturnType<typeof init>>): void {
  if (yydsRegistered) {
    return
  }
  yydsRegistered = true
  monaco.languages.register({ id: 'yyds' })
  monaco.languages.setMonarchTokensProvider('yyds', {
    keywords: [
      'yyds',
      'song',
      'tempo',
      'meter',
      'key',
      'unit',
      'velocity',
      'section',
      'track',
      'play',
      'refer',
      'repeat',
      'after'
    ],
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/".*?"/, 'string'],
        [/\b(?:[A-G](?:#|b)?\d|R)\b/, 'number'],
        [/\b\d+(?:\.\d+)?\b/, 'number.float'],
        [/\||@|%|=|->|-|\/(?:w|h|q|e|s|\d+)\.?/, 'operator'],
        [/[{}[\]()]/, 'delimiter.bracket'],
        [
          /\b[a-zA-Z_][\w-]*\b/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }
        ]
      ]
    }
  })
  monaco.languages.setLanguageConfiguration('yyds', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' }
    ]
  })
}

export async function createYydsEditor(
  el: HTMLElement,
  onChange: (source: string) => void,
  source = DEFAULT_SOURCE
): Promise<{
  getValue: () => string
  setValue: (next: string) => void
  dispose: () => void
}> {
  const monaco = await getMonaco()
  registerYyds(monaco)
  const model = monaco.editor.createModel(source, 'yyds')
  const editor = monaco.editor.create(el, {
    model,
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbersMinChars: 3,
    scrollBeyondLastLine: false
  })
  const disposable = editor.onDidChangeModelContent(() => {
    onChange(editor.getValue())
  })
  onChange(editor.getValue())

  return {
    getValue: () => editor.getValue(),
    setValue: (next: string) => {
      editor.setValue(next)
    },
    dispose: () => {
      disposable.dispose()
      model.dispose()
      editor.dispose()
    }
  }
}

export { DEFAULT_SOURCE }
