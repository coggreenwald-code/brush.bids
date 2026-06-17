// Stripe client configuration for BrushBids
// Uses Replit's Stripe connection API for credentials

import Stripe from 'stripe';
import https from 'https';

let connectionSettings: any;

// Cache the resolved Stripe credentials per environment for a short window so
// we don't hit the Replit connectors API on every request. The credential
// fetch is a network round-trip that, on a cold-started deployment, can push a
// single request past the client's timeout (surfacing as the misleading
// "client disconnected before the request was completed" error).
type CachedCreds = { publishableKey: string; secretKey: string };
let credsCache: { env: string; creds: CachedCreds; expires: number } | null = null;
const CREDS_TTL_MS = 10 * 60 * 1000;

async function getCredentials(): Promise<CachedCreds> {
  const env = process.env.REPLIT_DEPLOYMENT === '1' ? 'production' : 'development';
  if (credsCache && credsCache.env === env && credsCache.expires > Date.now()) {
    return credsCache.creds;
  }
  const creds = await fetchCredentials();
  credsCache = { env, creds, expires: Date.now() + CREDS_TTL_MS };
  return creds;
}

async function fetchCredentials(): Promise<CachedCreds> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  
  connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

// ROOT CAUSE of the POST /api/bids 500s on the live autoscale deployment:
// the request failed fast (~1.2s, NOT a timeout) with a Stripe-typed
// StripeConnectionError whose message was "The client disconnected before the
// request was completed." That string is NOT in the Stripe SDK — it's an
// underlying socket reset the SDK wraps.
//
// Node 20 defaults the global HTTPS agent to keepAlive:true. On autoscale the
// instance idles between bids; the pooled outbound socket to Stripe gets closed
// by Stripe's LB / the egress proxy; the next bid writes to that dead socket and
// resets instantly. The SDK's network retries can all grab stale pooled sockets
// in the same tick, so they don't save it.
//
// Fix: give the Stripe client its own agent that does NOT reuse idle sockets, so
// every Stripe call opens a known-good connection. The extra TLS handshake
// (~150ms) is negligible next to hard-failing the buyer's bid. maxNetworkRetries
// stays as a safety net for genuine transient blips.
const stripeAgent = new https.Agent({ keepAlive: false });

const STRIPE_OPTIONS: Stripe.StripeConfig = {
  apiVersion: '2025-11-17.clover',
  maxNetworkRetries: 2,
  timeout: 30000,
  httpAgent: stripeAgent,
};

let clientCache: { env: string; client: Stripe; expires: number } | null = null;
const CLIENT_TTL_MS = 10 * 60 * 1000;

// Cached Stripe client. Reuses the same instance (and cached credentials)
// within a ~10 minute window to keep per-request latency low. Use this for
// hot request paths like bid-hold creation.
export async function getStripeClient(): Promise<Stripe> {
  const env = process.env.REPLIT_DEPLOYMENT === '1' ? 'production' : 'development';
  if (clientCache && clientCache.env === env && clientCache.expires > Date.now()) {
    return clientCache.client;
  }
  const { secretKey } = await getCredentials();
  const client = new Stripe(secretKey, STRIPE_OPTIONS);
  clientCache = { env, client, expires: Date.now() + CLIENT_TTL_MS };
  return client;
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();

  return new Stripe(secretKey, STRIPE_OPTIONS);
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

export function getAppOrigin(): string {
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
  if (isProduction && domain) return `https://${domain}`;
  if (domain) return `https://${domain}`;
  return 'http://localhost:5000';
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
