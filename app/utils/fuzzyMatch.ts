// Shared fuzzy search utility
// Matches substrings and subsequences for fuzzy filtering
export function fuzzyMatch(text: string, pattern: string): boolean {
  const t = text.toLowerCase();
  const p = pattern.toLowerCase();
  if (!p) return true;
  if (t.includes(p)) return true;
  let ti = 0,
    pi = 0;
  while (ti < t.length && pi < p.length) {
    if (t[ti] === p[pi]) pi++;
    ti++;
  }
  return pi === p.length;
}
