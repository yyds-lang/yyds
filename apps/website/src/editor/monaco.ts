import { ensureShikiRuntime } from './shikiRuntime'

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

export async function createYydsEditor(
  el: HTMLElement,
  onChange: (source: string) => void,
  source = DEFAULT_SOURCE
): Promise<{
  getValue: () => string
  setValue: (next: string) => void
  dispose: () => void
}> {
  const runtime = await ensureShikiRuntime()
  const monaco = runtime.monaco
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
