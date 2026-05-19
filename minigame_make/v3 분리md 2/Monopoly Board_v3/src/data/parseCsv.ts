export function parseCsv(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, "");
  const lines = t.split(/\r?\n/).filter((line) => line.length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i]!;
      if (inQuotes) {
        if (c === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    row.push(cur);
    return row;
  });
}

export function rowsToObjects<T extends string>(
  headers: T[],
  rows: string[][],
): Record<T, string>[] {
  const out: Record<T, string>[] = [];
  for (const cells of rows) {
    const o = {} as Record<T, string>;
    for (let i = 0; i < headers.length; i++) {
      o[headers[i]!] = cells[i] ?? "";
    }
    out.push(o);
  }
  return out;
}
