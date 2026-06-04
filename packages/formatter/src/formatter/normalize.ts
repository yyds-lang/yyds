import type {
  BarEvent,
  BarEventDraft,
  DocumentIr,
  NormalizedBarNode,
  NormalizedDocumentIr,
  NormalizedSectionItemNode,
  NormalizedSectionNode,
  NormalizedTopLevelNode,
  NormalizedTrackItemNode,
  NormalizedTrackNode,
  SectionNode,
  SimpleLineNode,
  TopLevelNode,
  TrackNode
} from './types.ts'

const DEFAULT_UNIT = 'q'

interface NormalizeState {
  unit: string
}

export function normalizeDocument(ir: DocumentIr): NormalizedDocumentIr {
  const state: NormalizeState = { unit: DEFAULT_UNIT }
  const nodes = ir.nodes.map((node) => normalizeTopLevelNode(node, state))
  return { nodes }
}

function normalizeTopLevelNode(node: TopLevelNode, state: NormalizeState): NormalizedTopLevelNode {
  if (node.kind === 'section') {
    return normalizeSectionNode(node, state)
  }
  if (node.kind === 'line') {
    updateUnitByLine(node, state)
  }
  return node
}

function normalizeSectionNode(node: SectionNode, state: NormalizeState): NormalizedSectionNode {
  const items: NormalizedSectionItemNode[] = node.items.map((item) => {
    if (item.kind === 'track') {
      return normalizeTrackNode(item, state)
    }
    if (item.kind === 'line') {
      updateUnitByLine(item, state)
    }
    return item
  })
  return {
    kind: 'section',
    headerTokens: node.headerTokens,
    items
  }
}

function normalizeTrackNode(node: TrackNode, state: NormalizeState): NormalizedTrackNode {
  if (!node.items || node.items.length === 0) {
    return {
      kind: 'track',
      headerTokens: node.headerTokens,
      referTokens: node.referTokens
    }
  }
  const items: NormalizedTrackItemNode[] = node.items.map((item) => {
    if (item.kind === 'bar') {
      return normalizeBarNode(item, state.unit)
    }
    if (item.kind === 'line') {
      updateUnitByLine(item, state)
    }
    return item
  })
  return {
    kind: 'track',
    headerTokens: node.headerTokens,
    referTokens: node.referTokens,
    items
  }
}

function normalizeBarNode(
  node: { events: BarEventDraft[]; trailingComment?: string },
  unit: string
): NormalizedBarNode {
  return {
    kind: 'bar',
    events: node.events.map((item) => toBarEvent(item, unit)),
    trailingComment: node.trailingComment
  }
}

function updateUnitByLine(node: SimpleLineNode, state: NormalizeState): void {
  const keyword = node.tokens[0]
  if (!keyword || keyword.kind !== 'ident' || keyword.text !== 'unit') {
    return
  }
  const valueToken = node.tokens.find((token, index) => index > 0 && token.kind !== 'comment')
  if (!valueToken) {
    return
  }
  state.unit = valueToken.text
}

function toBarEvent(item: BarEventDraft, unit: string): BarEvent {
  let duration = durationTicks(item.durationUnit ?? unit)
  if (item.dotted) {
    duration += Math.floor(duration / 2)
  }
  return { text: item.text, duration }
}

function durationTicks(unit: string): number {
  const map: Record<string, number> = {
    w: 64,
    h: 32,
    q: 16,
    e: 8,
    s: 4,
    '1': 64,
    '2': 32,
    '4': 16,
    '8': 8,
    '16': 4,
    '32': 2,
    '64': 1
  }
  return map[unit] ?? map.q
}

export { DEFAULT_UNIT }
