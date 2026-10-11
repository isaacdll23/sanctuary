import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // Traefik terminates TLS and forwards to the app over plain HTTP, so the
  // server sees an `http://` request URL while browsers send an `https://`
  // Origin on form submissions. React Router 8.4's CSRF guard rejects that
  // mismatch with a 400 unless the public host is allowlisted here.
  allowedActionOrigins: ["sanctuary.isaacdelalama.dev"],
} satisfies Config;
