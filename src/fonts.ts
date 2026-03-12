import { alpha1 } from "./alphabet";
import { alpha2 } from "./alphabet-2";

export const fonts = {
  "font-1": alpha1,
  // "font-2": alpha2,
} as const;

export type FontKey = keyof typeof fonts;
export type FontAlpha = (typeof fonts)[FontKey];
