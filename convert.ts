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
  const { path, md } = config;
  const mdx = md;
  return { path, mdx };
}
