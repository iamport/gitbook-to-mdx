import { convertPath, removeExt } from "./path-converter.ts";

export type Lang = "ko" | "en";

export interface ConvertConfig {
  lang: Lang;
  path: string;
  md: string;
}
export interface ConvertResult {
  path: string;
  mdx: string;
}
export function convert(config: ConvertConfig): ConvertResult {
  const { md } = config;
  const path = convertPath(removeExt(config.path)) + ".mdx";
  const mdx = md;
  return { path, mdx };
}
