---
name: Autoscale + external HTTP client stale-socket resets
description: Why outbound calls (Stripe etc.) intermittently fail fast with connection resets on autoscale, and the agent fix.
---

# Stale keep-alive sockets on autoscale → fast connection resets

On the autoscale deployment, outbound calls to an external API (Stripe in this
case) intermittently failed in **~1s with a connection-class error**, not a
timeout. The user-visible message was a wrapped underlying socket error
("client disconnected before the request was completed") — that exact string is
**not** in the SDK source, so don't grep the SDK for it; it's the OS/agent layer.

**Why:** Node 18+/20 default the global HTTPS agent to `keepAlive: true`. On
autoscale an instance idles between requests; a pooled outbound socket gets
closed by the remote LB / egress proxy; the next request writes to that dead
socket and resets instantly. SDK network-retries can grab equally-stale pooled
sockets in the same tick, so retries alone do **not** reliably fix it.

**How to apply:** For bursty/scale-to-zero workloads, give the external-API
client its own agent that does **not** reuse idle sockets
(`new https.Agent({ keepAlive: false })`) — accept one extra TLS handshake per
call in exchange for eliminating the reset class. Keep network-retries as a
safety net. Diagnose this family by checking **elapsed ms** of the failure: a
fast (~1s) connection error = stale socket, a slow (~timeout) one = real latency.
Note: a vendored sync/SDK package that constructs its **own** client (e.g. a
webhook/backfill helper) won't inherit your agent — harden it separately if its
flows show the same resets.
