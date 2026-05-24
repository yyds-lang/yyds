import type { Diagnostic, ProgramNode, Range, SectionNode, TrackNode } from "@yyds-lang/ast/types";
import { YYDS_DIAGNOSTIC_CODES, YYDS_DIAGNOSTIC_SEVERITY } from "@yyds-lang/ast";

export type SymbolKind = "macro" | "section" | "track";

export interface SymbolDefinition {
  id: string;
  kind: SymbolKind;
  name: string;
  range: Range;
  detail?: string;
  container?: string;
}

export interface SymbolReference {
  id: string;
  kind: SymbolKind;
  name: string;
  range: Range;
}

export interface SemanticModel {
  sections: string[];
  diagnostics: Diagnostic[];
  definitions: SymbolDefinition[];
  references: SymbolReference[];
}

interface TrackRefItem {
  ownerKey: string;
  targetSection: string;
  targetTrack: string;
}

function createTrackKey(sectionName: string, trackIndex: number): string {
  return `${sectionName}#${trackIndex}`;
}

function pushDiagnostic(
  diagnostics: Diagnostic[],
  range: Range,
  code: string,
  message: string,
): void {
  diagnostics.push({
    code,
    severity: YYDS_DIAGNOSTIC_SEVERITY.ERROR,
    message,
    range,
  });
}

export function analyze(program: ProgramNode): SemanticModel {
  const sectionSet = new Set<string>();
  const macroSet = new Set<string>();
  const diagnostics: Diagnostic[] = [];
  const definitions: SymbolDefinition[] = [];
  const references: SymbolReference[] = [];
  const pendingMacroRefs: SymbolReference[] = [];
  const refs: TrackRefItem[] = [];
  const sectionMap = new Map<string, SectionNode>();
  const trackMapBySection = new Map<string, Map<string, number>>();
  const trackByKey = new Map<string, TrackNode>();

  const pushDefinition = (definition: SymbolDefinition): void => {
    definitions.push(definition);
  };

  const pushReference = (reference: SymbolReference): void => {
    references.push(reference);
  };

  for (const node of program.body) {
    if (node.type === "ChordAlias") {
      const symbolId = `macro:${node.name}`;
      if (macroSet.has(node.name)) {
        diagnostics.push({
          code: YYDS_DIAGNOSTIC_CODES.SEM_DUPLICATE_CHORD_ALIAS,
          severity: YYDS_DIAGNOSTIC_SEVERITY.ERROR,
          message: `Duplicate chord alias "${node.name}".`,
          range: node.nameRange,
        });
      } else {
        macroSet.add(node.name);
      }
      pushDefinition({
        id: symbolId,
        kind: "macro",
        name: node.name,
        range: node.nameRange,
        detail: `[${node.value}]`,
      });
      continue;
    }

    if (node.type === "Play") {
      pushReference({
        id: `section:${node.section}`,
        kind: "section",
        name: node.section,
        range: node.sectionRange,
      });
      continue;
    }

    if (node.type !== "Section") {
      continue;
    }

    if (!sectionMap.has(node.name)) {
      sectionMap.set(node.name, node);
    }
    if (sectionSet.has(node.name)) {
      diagnostics.push({
        code: YYDS_DIAGNOSTIC_CODES.SEM_DUPLICATE_SECTION,
        severity: YYDS_DIAGNOSTIC_SEVERITY.ERROR,
        message: `Duplicate section "${node.name}".`,
        range: node.range,
      });
    } else {
      sectionSet.add(node.name);
    }
    pushDefinition({
      id: `section:${node.name}`,
      kind: "section",
      name: node.name,
      range: node.nameRange,
    });

    const trackMap = new Map<string, number>();
    trackMapBySection.set(node.name, trackMap);
    node.tracks.forEach((track, index) => {
      const trackKey = createTrackKey(node.name, index);
      trackByKey.set(trackKey, track);
      if (!trackMap.has(track.name)) {
        trackMap.set(track.name, index);
      }
      pushDefinition({
        id: `track:${node.name}:${track.name}`,
        kind: "track",
        name: track.name,
        range: track.nameRange,
        container: node.name,
      });

      for (const bar of track.bars) {
        for (const chordRef of bar.chordRefs) {
          const symbolId = `macro:${chordRef.name}`;
          const reference: SymbolReference = {
            id: symbolId,
            kind: "macro",
            name: chordRef.name,
            range: chordRef.range,
          };
          pushReference(reference);
          pendingMacroRefs.push(reference);
        }
      }

      if (!track.ref) {
        return;
      }
      if (track.ref.sectionRange) {
        pushReference({
          id: `section:${track.ref.section}`,
          kind: "section",
          name: track.ref.section,
          range: track.ref.sectionRange,
        });
      }
      if (track.ref.trackRange) {
        pushReference({
          id: `track:${track.ref.section}:${track.ref.track}`,
          kind: "track",
          name: track.ref.track,
          range: track.ref.trackRange,
        });
      }
      refs.push({
        ownerKey: trackKey,
        targetSection: track.ref.section,
        targetTrack: track.ref.track,
      });
    });
  }

  for (const reference of pendingMacroRefs) {
    if (!macroSet.has(reference.name)) {
      diagnostics.push({
        code: YYDS_DIAGNOSTIC_CODES.SEM_UNKNOWN_CHORD_ALIAS,
        severity: YYDS_DIAGNOSTIC_SEVERITY.ERROR,
        message: `Unknown chord alias "${reference.name}".`,
        range: reference.range,
      });
    }
  }

  const trackGraph = new Map<string, string>();
  for (const item of refs) {
    const ownerTrack = trackByKey.get(item.ownerKey);
    if (!ownerTrack) {
      continue;
    }
    const targetSection = sectionMap.get(item.targetSection);
    if (!targetSection) {
      pushDiagnostic(
        diagnostics,
        ownerTrack.range,
        YYDS_DIAGNOSTIC_CODES.SEM_UNKNOWN_SECTION,
        `Unknown referenced section "${item.targetSection}".`,
      );
      continue;
    }
    const targetTrackMap = trackMapBySection.get(targetSection.name);
    const targetIndex = targetTrackMap?.get(item.targetTrack);
    if (targetIndex === undefined) {
      pushDiagnostic(
        diagnostics,
        ownerTrack.range,
        YYDS_DIAGNOSTIC_CODES.SEM_UNKNOWN_TRACK,
        `Unknown referenced track "${item.targetTrack}" in section "${item.targetSection}".`,
      );
      continue;
    }
    trackGraph.set(item.ownerKey, createTrackKey(targetSection.name, targetIndex));
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const detectCycle = (key: string): void => {
    if (visited.has(key)) {
      return;
    }
    if (visiting.has(key)) {
      const track = trackByKey.get(key);
      if (track) {
        pushDiagnostic(
          diagnostics,
          track.range,
          YYDS_DIAGNOSTIC_CODES.SEM_CYCLIC_REF,
          "Cyclic track reference detected.",
        );
      }
      return;
    }
    visiting.add(key);
    const next = trackGraph.get(key);
    if (next) {
      detectCycle(next);
    }
    visiting.delete(key);
    visited.add(key);
  };

  for (const key of trackGraph.keys()) {
    detectCycle(key);
  }

  return {
    sections: [...sectionSet],
    diagnostics,
    definitions,
    references,
  };
}
