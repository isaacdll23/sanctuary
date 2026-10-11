export interface NamedOption {
  id: number;
  name: string;
}

export type ReferenceResolution<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; candidates?: T[] };

/**
 * Resolves a user-owned record by explicit id or by name, without ever acting
 * on an ambiguous match. An exact case-insensitive name wins; otherwise a
 * case-insensitive substring is used, and multiple matches are returned as
 * candidates for the caller to disambiguate.
 */
export function resolveReference<T extends NamedOption>(
  options: readonly T[],
  reference: { id?: number; name?: string },
  noun: string
): ReferenceResolution<T> {
  if (reference.id != null) {
    const value = options.find((option) => option.id === reference.id);
    return value
      ? { ok: true, value }
      : { ok: false, error: `No ${noun} found with id ${reference.id}.` };
  }

  const name = reference.name?.trim();
  if (!name) return { ok: false, error: `Provide the ${noun} id or name.` };

  const lowered = name.toLocaleLowerCase();
  const exact = options.filter(
    (option) => option.name.toLocaleLowerCase() === lowered
  );
  const matches = exact.length
    ? exact
    : options.filter((option) =>
        option.name.toLocaleLowerCase().includes(lowered)
      );

  if (!matches.length) {
    return { ok: false, error: `No ${noun} matches “${name}”.` };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      error: `Multiple ${noun}s match “${name}”. Ask the user which one they mean, then retry with its id.`,
      candidates: [...matches],
    };
  }
  return { ok: true, value: matches[0] };
}
