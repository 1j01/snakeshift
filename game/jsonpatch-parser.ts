import type { AddedDelta, ModifiedDelta, DeletedDelta, ObjectDelta, ArrayDelta, MovedDelta, TextDiffDelta, Delta } from 'jsondiffpatch'
import type { Op } from "jsondiffpatch/formatters/jsonpatch"

// export interface AddOp {
//     op: 'add';
//     path: string;
//     value: unknown;
// }
// export interface RemoveOp {
//     op: 'remove';
//     path: string;
// }
// export interface ReplaceOp {
//     op: 'replace';
//     path: string;
//     value: unknown;
// }
// export interface MoveOp {
//     op: 'move';
//     from: string;
//     path: string;
// }
// export type Op = AddOp | RemoveOp | ReplaceOp | MoveOp;

// export type AddedDelta = [unknown];
// export type ModifiedDelta = [unknown, unknown];
// export type DeletedDelta = [unknown, 0, 0];
// export interface ObjectDelta {
//     [property: string]: Delta;
// }
// export interface ArrayDelta {
//     _t: 'a';
//     [index: number | `${number}`]: Delta;
//     [index: `_${number}`]: DeletedDelta | MovedDelta;
// }
// export type MovedDelta = [unknown, number, 3];
// export type TextDiffDelta = [string, 0, 2];
// export type Delta = AddedDelta | ModifiedDelta | DeletedDelta | ObjectDelta | ArrayDelta | MovedDelta | TextDiffDelta | undefined;

export function parse(jsonpatch: Op[]): Delta[] {
  const deltas: Delta[] = []
  for (const op of jsonpatch) {
    switch (op.op) {
      case 'add':
        deltas.push([op.value] as AddedDelta)
        break
      case 'remove':
        deltas.push([undefined, 0, 0] as DeletedDelta)
        break
      case 'replace':
        deltas.push([undefined, op.value] as ModifiedDelta)
        break
      case 'move':
        deltas.push([op.from, parseInt(op.path.match(/\d+$/)[0]), 3] as MovedDelta)
        break
    }
  }
  return deltas
}
