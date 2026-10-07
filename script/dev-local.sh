#!/bin/sh
# Local test server. If the Stripe CLI is logged in, use its webhook signing
# secret so events forwarded by `npm run stripe:listen` are accepted.
STRIPE_BIN="$(command -v stripe || echo "$HOME/.local/stripe-cli/node_modules/.bin/stripe")"
if [ -z "$STRIPE_WEBHOOK_SECRET" ] && [ -x "$STRIPE_BIN" ]; then
  STRIPE_WEBHOOK_SECRET="$("$STRIPE_BIN" listen --print-secret 2>/dev/null)"
  export STRIPE_WEBHOOK_SECRET
fi
export NODE_ENV=development LOCAL_DEV_AUTH=1 PORT=5050 SESSION_SECRET=local-dev-only
export DATABASE_URL=postgres://postgres:postgres@localhost:5433/brushbids
exec npx tsx --env-file-if-exists=.env server/index.ts
