// Stripe client configuration for BrushBids
// Uses Replit's Stripe connection API for credentials

import Stripe from 'stripe';

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

// Shared Stripe SDK options. maxNetworkRetries + a generous timeout make the
// SDK retry transient connection blips instead of bubbling up a
// StripeConnectionError ("...client disconnected before the request was
// completed"), which is what was failing POST /api/bids on the live deployment.
const STRIPE_OPTIONS: Stripe.StripeConfig = {
  apiVersion: '2025-11-17.clover',
  maxNetworkRetries: 2,
  timeout: 30000,
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
