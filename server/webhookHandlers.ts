// Webhook handlers for Stripe events
// Uses stripe-replit-sync for automatic processing with custom payment confirmation

import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Parse the event to handle checkout.session.completed
    const stripe = await getUncachableStripeClient();
    const webhookSecret = await sync.getWebhookSecret();
    
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const sessionId = session.id;
        const metadata = session.metadata;
        
        // Look up artwork by session ID (source of truth)
        const artwork = await storage.getArtworkBySessionId(sessionId);
        
        if (artwork && !artwork.paidAt) {
          // Verify metadata matches the artwork we found (security check)
          if (metadata?.artworkId && Number(metadata.artworkId) === artwork.id) {
            // Verify paidBy (set at checkout) matches the bidderId in metadata
            if (artwork.paidBy === metadata.bidderId) {
              await storage.markArtworkPaid(artwork.id);
              console.log(`Payment confirmed for artwork ${artwork.id} by ${artwork.paidBy}`);
            } else {
              console.warn(`Bidder mismatch for artwork ${artwork.id}: stored ${artwork.paidBy}, session ${metadata.bidderId}`);
            }
          } else {
            console.warn(`Metadata mismatch for session ${sessionId}: expected artwork ${artwork.id}, got ${metadata?.artworkId}`);
          }
        } else if (artwork?.paidAt) {
          console.log(`Artwork ${artwork.id} already marked as paid, skipping`);
        }
      }
    } catch (err) {
      // Event verification or handling failed, but sync already processed it
      console.error('Custom webhook handling error:', err);
    }
  }
}
