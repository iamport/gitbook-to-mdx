export function removeExt(pathWithExt: string): string {
  return pathWithExt.replace(/\.[a-z0-9]+$/, "");
}

export function convertPath(pathWithoutExt: string): string {
  return pathWithoutExt
    .split("/").filter(Boolean)
    .map((c) => c.split(/[() .-]/g).filter(Boolean).join("-").toLowerCase())
    .join("/");
}
