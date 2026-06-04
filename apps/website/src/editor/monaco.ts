import { ensureShikiRuntime } from './shikiRuntime'
import { formatYydsSourceInWorker } from './format'

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

let formatterRegistered = false

function ensureFormattingProvider(
  monaco: Awaited<ReturnType<typeof ensureShikiRuntime>>['monaco']
): void {
  if (formatterRegistered) {
    return
  }
  formatterRegistered = true
  monaco.languages.registerDocumentFormattingEditProvider('yyds', {
    async provideDocumentFormattingEdits(model) {
      try {
        const current = model.getValue()
        const formatted = await formatYydsSourceInWorker(current)
        if (formatted === current) {
          return []
        }
        return [{ range: model.getFullModelRange(), text: formatted }]
      } catch {
        return []
      }
    }
  })
}

export async function createYydsEditor(
  el: HTMLElement,
  onChange: (source: string) => void,
  source = DEFAULT_SOURCE
): Promise<{
  getValue: () => string
  setValue: (next: string) => void
  formatDocument: () => Promise<string>
  dispose: () => void
}> {
  const runtime = await ensureShikiRuntime()
  const monaco = runtime.monaco
  ensureFormattingProvider(monaco)
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

  const formatDocument = async (): Promise<string> => {
    const formatted = await formatYydsSourceInWorker(editor.getValue())
    if (formatted !== editor.getValue()) {
      editor.setValue(formatted)
    }
    return formatted
  }

  return {
    getValue: () => editor.getValue(),
    setValue: (next: string) => {
      editor.setValue(next)
    },
    formatDocument,
    dispose: () => {
      disposable.dispose()
      model.dispose()
      editor.dispose()
    }
  }
}

export { DEFAULT_SOURCE }
