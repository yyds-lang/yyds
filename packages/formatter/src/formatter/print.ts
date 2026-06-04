import type {
  AliasNode,
  BarEvent,
  CommentNode,
  FormatterOptions,
  NormalizedBarNode,
  NormalizedDocumentIr,
  NormalizedSectionNode,
  NormalizedTopLevelNode,
  NormalizedTrackItemNode,
  NormalizedTrackNode,
  SimpleLineNode
} from './types.ts'

const TIGHT_PREFIX = new Set([']', '.', '@', '/', '#', '}', ')'])
const TIGHT_SUFFIX = new Set(['[', '%', '/', '@', '-', '+', '#', '(', '{'])

export function printDocument(ir: NormalizedDocumentIr, options: FormatterOptions = {}): string {
  const lineEnding = options.lineEnding ?? '\n'
  const finalNewline = options.finalNewline ?? true
  const lines: string[] = []

  ir.nodes.forEach((node, index) => {
    lines.push(...renderTopLevelNode(node, 0))
    const next = ir.nodes[index + 1]
    if (next && shouldInsertTopLevelGap(node, next)) {
      lines.push('')
    }
  })

  const joined = lines.join(lineEnding).replace(/[ \t]+$/gm, '')
  if (!finalNewline) {
    return joined
  }
  return joined.endsWith(lineEnding) ? joined : `${joined}${lineEnding}`
}

function renderTopLevelNode(node: NormalizedTopLevelNode, indentLevel: number): string[] {
  if (node.kind === 'comment') {
    return [withIndent(node.text, indentLevel)]
  }
  if (node.kind === 'alias') {
    return [withIndent(renderAlias(node), indentLevel)]
  }
  if (node.kind === 'line') {
    return [withIndent(renderSimpleLine(node), indentLevel)]
  }
  return renderSection(node, indentLevel)
}

function renderSection(node: NormalizedSectionNode, indentLevel: number): string[] {
  const lines: string[] = [withIndent(`${formatTokenSequence(node.headerTokens)} {`, indentLevel)]

  let previousTrack = false
  for (const item of node.items) {
    if (item.kind === 'track') {
      if (previousTrack) {
        lines.push('')
      }
      lines.push(...renderTrack(item, indentLevel + 1))
      previousTrack = true
      continue
    }
    previousTrack = false
    if (item.kind === 'comment') {
      lines.push(withIndent(item.text, indentLevel + 1))
      continue
    }
    if (item.kind === 'alias') {
      lines.push(withIndent(renderAlias(item), indentLevel + 1))
      continue
    }
    lines.push(withIndent(renderSimpleLine(item), indentLevel + 1))
  }

  lines.push(withIndent('}', indentLevel))
  return lines
}

function renderTrack(node: NormalizedTrackNode, indentLevel: number): string[] {
  if (!node.items || node.items.length === 0) {
    if (node.referTokens && node.referTokens.length > 0) {
      return [
        withIndent(
          `${formatTokenSequence(node.headerTokens)} ${formatTokenSequence(node.referTokens)}`,
          indentLevel
        )
      ]
    }
    return [withIndent(formatTokenSequence(node.headerTokens), indentLevel)]
  }

  const lines: string[] = [withIndent(`${formatTokenSequence(node.headerTokens)} {`, indentLevel)]
  lines.push(...renderTrackItems(node.items, indentLevel + 1))
  lines.push(withIndent('}', indentLevel))
  return lines
}

function renderTrackItems(items: NormalizedTrackItemNode[], indentLevel: number): string[] {
  const lines: string[] = []
  const bars = items.filter((item): item is NormalizedBarNode => item.kind === 'bar')
  let slotWidth = 2
  for (const bar of bars) {
    for (const event of bar.events) {
      const span = eventSpan(event.duration)
      const candidate = Math.ceil(event.text.length / span)
      if (candidate > slotWidth) {
        slotWidth = candidate
      }
    }
  }
  const barInners = bars.map((bar) => renderAlignedBar(bar.events, slotWidth))
  const maxInner = Math.max(0, ...barInners.map((item) => item.length))

  let barCursor = 0
  for (const item of items) {
    if (item.kind === 'comment') {
      lines.push(withIndent(item.text, indentLevel))
      continue
    }
    if (item.kind === 'line') {
      lines.push(withIndent(renderSimpleLine(item), indentLevel))
      continue
    }
    const inner = barInners[barCursor] ?? ''
    barCursor += 1
    const rendered = `| ${padRight(inner, maxInner)} |`
    const withComment = item.trailingComment ? `${rendered} ${item.trailingComment}` : rendered
    lines.push(withIndent(withComment, indentLevel))
  }

  return lines
}

function renderAlias(node: AliasNode): string {
  const name = node.name || 'anonymous_alias'
  const value = node.valueTokens.length > 0 ? formatTokenSequence(node.valueTokens) : ''
  const base = `%${name} = [${value}]`
  return node.trailingComment ? `${base} ${node.trailingComment}` : base
}

function renderSimpleLine(node: SimpleLineNode): string {
  return formatTokenSequence(node.tokens)
}

function formatTokenSequence(tokens: { kind: string; text: string }[]): string {
  let output = ''
  let previous: { kind: string; text: string } | undefined
  for (const token of tokens) {
    if (token.kind === 'comment') {
      if (output.length > 0 && !output.endsWith(' ')) {
        output += ' '
      }
      output += token.text
      break
    }
    if (previous && shouldInsertSpace(previous, token)) {
      output += ' '
    }
    output += token.text
    previous = token
  }
  return output
}

function shouldInsertSpace(
  previous: { kind: string; text: string },
  current: { kind: string; text: string }
): boolean {
  if (TIGHT_PREFIX.has(current.text) || TIGHT_SUFFIX.has(previous.text)) {
    return false
  }
  if (
    (previous.text === 'track' && current.text === '[') ||
    previous.text === '->' ||
    current.text === '->'
  ) {
    return false
  }
  if ((previous.text === '-' || previous.text === '=') && current.text === '>') {
    return false
  }
  return true
}

function shouldInsertTopLevelGap(
  previous: NormalizedTopLevelNode,
  next: NormalizedTopLevelNode
): boolean {
  if (previous.kind === 'section' || next.kind === 'section') {
    return true
  }
  if (previous.kind === 'alias' && next.kind !== 'alias' && next.kind !== 'comment') {
    return true
  }
  if (previous.kind === 'line' && startsWithUnit(previous) && next.kind !== 'comment') {
    return true
  }
  return false
}

function startsWithUnit(node: SimpleLineNode): boolean {
  return node.tokens[0]?.kind === 'ident' && node.tokens[0].text === 'unit'
}

function renderAlignedBar(events: BarEvent[], slotWidth: number): string {
  let output = ''
  let position = 0
  for (const event of events) {
    let start = Math.floor((position * slotWidth) / 4)
    if (output.length > 0 && output.length >= start) {
      start = output.length + 1
    }
    while (output.length < start) {
      output += ' '
    }
    output += event.text
    position += event.duration
  }
  return output
}

function eventSpan(duration: number): number {
  const span = Math.floor(duration / 4)
  return span < 1 ? 1 : span
}

function padRight(value: string, width: number): string {
  if (value.length >= width) {
    return value
  }
  return `${value}${' '.repeat(width - value.length)}`
}

function withIndent(text: string, level: number): string {
  return `${'  '.repeat(level)}${text}`
}

export type { NormalizedBarNode, CommentNode }
