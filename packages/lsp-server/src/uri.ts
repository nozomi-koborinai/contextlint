export function uriToPath(uri: string): string {
  if (!uri.startsWith("file://")) return uri;
  const stripped = uri.slice("file://".length);
  return decodeURIComponent(stripped);
}
