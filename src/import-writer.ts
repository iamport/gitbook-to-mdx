export function createImportInfo(): ImportInfo {
  return {
    codepen: false,
    contentRef: false,
    hint: false,
    swagger: false,
    tabAndTabs: false,
    youtube: false,
  };
}
export interface ImportInfo {
  codepen: boolean;
  contentRef: boolean;
  hint: boolean;
  swagger: boolean;
  tabAndTabs: boolean;
  youtube: boolean;
}
export function writeImports(info: ImportInfo): string {
  const result: string[] = [
    `\nimport * as prose from "~/components/prose";\n`,
    `export const components = prose;\n\n`,
  ];
  if (info.codepen) {
    result.push(`import Codepen from "~/components/gitbook/Codepen.astro";\n`);
  }
  if (info.contentRef) {
    result.push(
      `import ContentRef from "~/components/gitbook/ContentRef.astro";\n`,
    );
  }
  if (info.hint) {
    result.push(`import Hint from "~/components/gitbook/Hint";\n`);
  }
  if (info.swagger) {
    result.push(
      `import Swagger from "~/components/gitbook/swagger/Swagger.astro";\n`,
      `import SwaggerDescription from "~/components/gitbook/swagger/SwaggerDescription.astro";\n`,
      `import SwaggerParameter from "~/components/gitbook/swagger/SwaggerParameter.astro";\n`,
      `import SwaggerResponse from "~/components/gitbook/swagger/SwaggerResponse.astro";\n`,
    );
  }
  if (info.tabAndTabs) {
    result.push(
      `import Tabs from "~/components/gitbook/tabs/Tabs.astro";\n`,
      `import Tab from "~/components/gitbook/tabs/Tab.astro";\n`,
    );
  }
  if (info.youtube) {
    result.push(
      `import Youtube from "~/components/gitbook/Youtube.astro";\n`,
    );
  }
  return result.join("");
}
