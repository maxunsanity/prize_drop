/** `{key}` 자리에 값 치환 — CSV `07_text_strings` 의 value 템플릿용 */
export function formatLine(
  map: Record<string, string>,
  id: string,
  vars: Record<string, string | number>,
  fallback: string,
): string {
  let s = map[id];
  if (s == null || s === "") s = fallback;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

export function lineOr(
  map: Record<string, string>,
  id: string,
  fallback: string,
): string {
  const v = map[id];
  return v != null && v !== "" ? v : fallback;
}
