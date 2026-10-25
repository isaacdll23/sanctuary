import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PUSH_MAX_PAYLOAD_BYTES,
  PUSH_TEST_THROTTLE_MS,
  decodeBase64UrlToUint8Array,
  isPushTestThrottled,
  preparePushPayload,
  pushSubscriptionSchema,
  pushTestRetryAfterMs,
} from "./push";

const validSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc123:def456",
  keys: {
    p256dh: "B".repeat(87),
    auth: "a".repeat(22),
  },
};

describe("decodeBase64UrlToUint8Array", () => {
  it("decodes unpadded base64url into the original bytes", () => {
    assert.deepEqual(Array.from(decodeBase64UrlToUint8Array("AQAB")), [
      0x01, 0x00, 0x01,
    ]);
    assert.deepEqual(
      Array.from(decodeBase64UrlToUint8Array("aGVsbG8")),
      Array.from(new TextEncoder().encode("hello"))
    );
  });

  it("maps the url-safe alphabet and restores missing padding", () => {
    assert.deepEqual(Array.from(decodeBase64UrlToUint8Array("-_-_")), [
      0xfb, 0xff, 0xbf,
    ]);
    assert.deepEqual(
      Array.from(decodeBase64UrlToUint8Array("SGVsbG8tV29ybGRf")),
      Array.from(new TextEncoder().encode("Hello-World_"))
    );
  });

  it("throws on empty or non-base64url input", () => {
    assert.throws(() => decodeBase64UrlToUint8Array(""));
    assert.throws(() => decodeBase64UrlToUint8Array("not base64!"));
    assert.throws(() => decodeBase64UrlToUint8Array("abc="));
  });
});

describe("pushSubscriptionSchema", () => {
  it("accepts a valid browser subscription", () => {
    const parsed = pushSubscriptionSchema.safeParse(validSubscription);
    assert.equal(parsed.success, true);
  });

  it("rejects non-https endpoints", () => {
    const parsed = pushSubscriptionSchema.safeParse({
      ...validSubscription,
      endpoint: "http://example.com/push/123",
    });
    assert.equal(parsed.success, false);
  });

  it("rejects endpoints that are not URLs or are too long", () => {
    assert.equal(
      pushSubscriptionSchema.safeParse({
        ...validSubscription,
        endpoint: "https://",
      }).success,
      false
    );
    assert.equal(
      pushSubscriptionSchema.safeParse({
        ...validSubscription,
        endpoint: `https://example.com/${"a".repeat(2048)}`,
      }).success,
      false
    );
  });

  it("rejects missing or malformed keys", () => {
    assert.equal(
      pushSubscriptionSchema.safeParse({ endpoint: validSubscription.endpoint })
        .success,
      false
    );
    assert.equal(
      pushSubscriptionSchema.safeParse({
        ...validSubscription,
        keys: { p256dh: "short", auth: validSubscription.keys.auth },
      }).success,
      false
    );
    assert.equal(
      pushSubscriptionSchema.safeParse({
        ...validSubscription,
        keys: { p256dh: validSubscription.keys.p256dh, auth: "has spaces here" },
      }).success,
      false
    );
  });
});

describe("preparePushPayload", () => {
  it("accepts a small payload and returns serialized JSON", () => {
    const result = preparePushPayload({
      title: "Sanctuary",
      body: "Push notifications are working.",
      url: "/settings",
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(JSON.parse(result.json).body, "Push notifications are working.");
  });

  it("rejects missing or oversized fields", () => {
    assert.equal(preparePushPayload({ title: "", body: "hi" }).ok, false);
    assert.equal(
      preparePushPayload({ title: "a".repeat(121), body: "hi" }).ok,
      false
    );
    assert.equal(
      preparePushPayload({ title: "hi", body: "a".repeat(501) }).ok,
      false
    );
    assert.equal(
      preparePushPayload({ title: "hi", body: "there", url: "javascript:alert(1)" })
        .ok,
      false
    );
  });

  it("rejects a payload whose encoded size exceeds the delivery budget", () => {
    const result = preparePushPayload({
      title: "🔔".repeat(120),
      body: "📣".repeat(500),
      url: `/${"a".repeat(2047)}`,
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.error, /too large/);
    assert.ok(PUSH_MAX_PAYLOAD_BYTES < 4096);
  });
});

describe("push test throttle", () => {
  it("allows the first send", () => {
    assert.equal(isPushTestThrottled(null, 1_000), false);
  });

  it("blocks a second send inside the window and allows it afterwards", () => {
    const first = 10_000;
    assert.equal(isPushTestThrottled(first, first + 1), true);
    assert.equal(isPushTestThrottled(first, first + PUSH_TEST_THROTTLE_MS - 1), true);
    assert.equal(isPushTestThrottled(first, first + PUSH_TEST_THROTTLE_MS), false);
  });

  it("reports the remaining wait, clamped at zero", () => {
    const now = 5_000;
    assert.equal(pushTestRetryAfterMs(now, now + 2_500), 7_500);
    assert.equal(pushTestRetryAfterMs(now, now + 20_000), 0);
  });
});
