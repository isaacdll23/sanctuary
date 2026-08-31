import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromSession } from "~/modules/auth.server";
import {
  parseFeatureOverrides,
  resolveFeatureEnabled,
  USER_TOGGLEABLE_FEATURES,
  type FeatureId,
  type FeatureOverride,
  type FeatureOverrides,
} from "../featureFlags";

export interface FeatureSetting {
  id: FeatureId;
  title: string;
  description: string;
  /** Effective state: user override wins, otherwise platform default. */
  isEnabled: boolean;
  /** True when the user has a personal override stored for this feature. */
  isOverridden: boolean;
}

export function getFeatureSettingsForUser(user: {
  featureOverrides: unknown;
}): FeatureSetting[] {
  const overrides = parseFeatureOverrides(user.featureOverrides);

  return USER_TOGGLEABLE_FEATURES.map((feature) => ({
    ...feature,
    isEnabled: resolveFeatureEnabled(feature.id, overrides),
    isOverridden: overrides[feature.id] != null,
  }));
}

type ParsedOverrideInput =
  | { ok: true; featureId: FeatureId; override: FeatureOverride }
  | { ok: false; error: string };

/**
 * Validate untrusted form input for a feature toggle. Only user-toggleable
 * features and the two override values are accepted.
 */
export function parseFeatureOverrideInput(
  featureId: string,
  override: string
): ParsedOverrideInput {
  const feature = USER_TOGGLEABLE_FEATURES.find(
    (candidate) => candidate.id === featureId
  );
  if (!feature) {
    return { ok: false, error: "Unknown feature" };
  }
  if (override !== "enabled" && override !== "disabled") {
    return { ok: false, error: "Invalid feature override value" };
  }
  return { ok: true, featureId: feature.id, override };
}

export async function getFeatureOverridesForUser(
  userId: number
): Promise<FeatureOverrides> {
  const users = await db
    .select({ featureOverrides: usersTable.featureOverrides })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  return parseFeatureOverrides(users[0]?.featureOverrides);
}

export async function handleFeatureSettingsAction(request: Request) {
  const user = await getUserFromSession(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateFeatureVisibility") {
    const parsed = parseFeatureOverrideInput(
      String(formData.get("featureId") ?? ""),
      String(formData.get("override") ?? "")
    );
    if (!parsed.ok) {
      return { success: false, message: parsed.error };
    }

    const overrides = parseFeatureOverrides(user.featureOverrides);
    overrides[parsed.featureId] = parsed.override;

    await db
      .update(usersTable)
      .set({ featureOverrides: overrides })
      .where(eq(usersTable.id, user.id));

    const feature = USER_TOGGLEABLE_FEATURES.find(
      (candidate) => candidate.id === parsed.featureId
    );
    return {
      success: true,
      message: `${feature?.title ?? "Feature"} ${
        parsed.override === "enabled" ? "enabled" : "hidden"
      }.`,
    };
  }

  return { success: false, message: "Unknown action" };
}
