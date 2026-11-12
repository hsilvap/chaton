export const basename = (path: string) =>
  path.split("/").filter(Boolean).pop() ?? path;

export const tildify = (path: string) =>
  path.replace(/^\/(Users|home)\/[^/]+/, "~");
