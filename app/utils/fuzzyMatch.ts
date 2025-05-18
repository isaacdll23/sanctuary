// Shared fuzzy search utility
// Matches substrings and subsequences for fuzzy filtering
// Levenshtein distance helper
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] =
          1 +
          Math.min(
            matrix[i - 1][j], // deletion
            matrix[i][j - 1], // insertion
            matrix[i - 1][j - 1] // substitution
          );
      }
    }
  }
  return matrix[a.length][b.length];
}

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
  if (pi === p.length) return true;
  // Levenshtein distance threshold (allow 1 typo for short, 2 for longer)
  const threshold = p.length <= 4 ? 1 : 2;
  return levenshtein(t, p) <= threshold;
}
