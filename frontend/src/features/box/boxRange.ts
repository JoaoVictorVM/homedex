import { slotsPerBox } from '../pokemon/pokemon.schema.ts'

export type BoxRange = {
  first: number
  last: number
}

export function boxRange(boxNumber: number): BoxRange {
  return {
    first: (boxNumber - 1) * slotsPerBox + 1,
    last: boxNumber * slotsPerBox,
  }
}

export function nextBox(boxNumber: number, boxCount: number): number {
  return boxNumber >= boxCount ? 1 : boxNumber + 1
}

export function previousBox(boxNumber: number, boxCount: number): number {
  return boxNumber <= 1 ? boxCount : boxNumber - 1
}
