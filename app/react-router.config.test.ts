import assert from "node:assert/strict";
import { describe, it } from "node:test";
import config from "../react-router.config";

describe("react-router config", () => {
  it("allowlists the public host for action submissions", () => {
    // Traefik terminates TLS, so the app builds `http://` request URLs while
    // browsers send an `https://` Origin. React Router 8.4's CSRF guard returns
    // a 400 on that mismatch unless the public host is allowlisted, which would
    // break every form submission (including login).
    const origins = config.allowedActionOrigins ?? [];
    assert.ok(
      origins.includes("sanctuary.isaacdelalama.dev"),
      "the production host must be allowlisted for action submissions"
    );
  });
});
