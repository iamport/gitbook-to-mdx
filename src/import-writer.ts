export function createImportInfo(): ImportInfo {
  return {
    tabAndTabs: false,
  };
}
export interface ImportInfo {
  tabAndTabs: boolean;
}
export function writeImports(info: ImportInfo): string {
  const result: string[] = [
    `\nimport * as prose from "~/components/prose";\n`,
    `export const components = prose;\n\n`,
  ];
  if (info.tabAndTabs) {
    result.push(
      `import Tabs from "~/components/gitbook/tabs/Tabs.astro";\n`,
      `import Tab from "~/components/gitbook/tabs/Tab.astro";\n`,
    );
  }
  return result.join("");
}
