import { alpha1 } from "./alphabets/alphabet";
import { alpha2 } from "./alphabets/alphabet-2";
import { alpha3 } from "./alphabets/alphabet-3";
import { alpha4 } from "./alphabets/alphabet-4";
import { stretchAlphabet } from "./util/stretch";

export const fonts = {
  "font-1": alpha1,
  // "font-2": alpha2,
  "monogram": alpha3,
  // "kuchibue": alpha4,
  // "kuchibue-tall": stretchAlphabet(alpha4),
} as const;

export type FontKey = keyof typeof fonts;
export type FontAlpha = (typeof fonts)[FontKey];
