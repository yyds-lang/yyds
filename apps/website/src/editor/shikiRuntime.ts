import { init } from 'modern-monaco/core'
import { createYydsMonacoRuntime } from 'yyds-lang-shiki/monaco'

type MonacoRuntime = Awaited<ReturnType<typeof init>>
type ShikiRuntime = { monaco: MonacoRuntime }
const DEFAULT_THEME = 'vitesse-dark'

let runtimePromise: Promise<ShikiRuntime> | undefined
const yydsRuntime = createYydsMonacoRuntime({
  defaultTheme: DEFAULT_THEME
})

async function bootstrapRuntime(): Promise<ShikiRuntime> {
  const monaco = await init({ defaultTheme: DEFAULT_THEME })
  await yydsRuntime.setup(monaco)

  return { monaco }
}

export async function ensureShikiRuntime(): Promise<ShikiRuntime> {
  runtimePromise ??= bootstrapRuntime()
  try {
    return await runtimePromise
  } catch (error) {
    runtimePromise = undefined
    throw error
  }
}
