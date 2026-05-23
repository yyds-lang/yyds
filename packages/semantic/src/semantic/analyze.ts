import type { Diagnostic, ProgramNode, SectionNode, TrackNode } from "@yyds-lang/ast/types";
import { YYDS_DIAGNOSTIC_CODES, YYDS_DIAGNOSTIC_SEVERITY } from "@yyds-lang/ast";

export interface SemanticModel {
  sections: string[];
  diagnostics: Diagnostic[];
}

interface TrackRefItem {
  owner: TrackNode;
  ownerSection: SectionNode;
  targetSection: string;
  targetTrack: string;
}

function createTrackKey(sectionName: string, trackIndex: number): string {
  return `${sectionName}#${trackIndex}`;
}

function pushDiagnostic(
  diagnostics: Diagnostic[],
  track: TrackNode,
  code: string,
  message: string,
): void {
  diagnostics.push({
    code,
    severity: YYDS_DIAGNOSTIC_SEVERITY.ERROR,
    message,
    range: track.range,
  });
}

export function analyze(program: ProgramNode): SemanticModel {
  const sectionSet = new Set<string>();
  const diagnostics: Diagnostic[] = [];
  const sectionList: SectionNode[] = [];
  const refs: TrackRefItem[] = [];

  for (const node of program.body) {
    if (node.type === "Section") {
      sectionList.push(node);
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
      for (const track of node.tracks) {
        if (track.ref) {
          refs.push({
            owner: track,
            ownerSection: node,
            targetSection: track.ref.section,
            targetTrack: track.ref.track,
          });
        }
      }
    }
  }

  const sectionMap = new Map<string, SectionNode>();
  for (const section of sectionList) {
    if (!sectionMap.has(section.name)) {
      sectionMap.set(section.name, section);
    }
  }

  const trackGraph = new Map<string, string>();
  for (const section of sectionList) {
    section.tracks.forEach((track, index) => {
      const currentKey = createTrackKey(section.name, index);
      if (!track.ref) {
        return;
      }
      const targetSection = sectionMap.get(track.ref.section);
      if (!targetSection) {
        pushDiagnostic(
          diagnostics,
          track,
          YYDS_DIAGNOSTIC_CODES.SEM_UNKNOWN_SECTION,
          `Unknown referenced section "${track.ref.section}".`,
        );
        return;
      }
      const targetIndex = targetSection.tracks.findIndex((item) => item.name === track.ref?.track);
      if (targetIndex < 0) {
        pushDiagnostic(
          diagnostics,
          track,
          YYDS_DIAGNOSTIC_CODES.SEM_UNKNOWN_TRACK,
          `Unknown referenced track "${track.ref.track}" in section "${track.ref.section}".`,
        );
        return;
      }
      trackGraph.set(currentKey, createTrackKey(targetSection.name, targetIndex));
    });
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const keyToTrack = new Map<string, TrackNode>();

  for (const section of sectionList) {
    section.tracks.forEach((track, index) => {
      keyToTrack.set(createTrackKey(section.name, index), track);
    });
  }

  const detectCycle = (key: string): void => {
    if (visited.has(key)) {
      return;
    }
    if (visiting.has(key)) {
      const track = keyToTrack.get(key);
      if (track) {
        pushDiagnostic(
          diagnostics,
          track,
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

  for (const item of refs) {
    const key = createTrackKey(
      item.ownerSection.name,
      item.ownerSection.tracks.indexOf(item.owner),
    );
    detectCycle(key);
  }

  return {
    sections: [...sectionSet],
    diagnostics,
  };
}
