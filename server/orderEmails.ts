// Emails for offers and orders. Without SMTP settings (local testing) each
// email is logged to the console instead of sent.
import { getTransporter } from "./emailService";
import { storage } from "./storage";
import { getAppOrigin } from "./stripeClient";
import { INSPECTION_DAYS, OFFER_WINDOW_HOURS } from "@shared/siteConfig";

type Recipient = { userId: string; email: string | null | undefined };

async function send(to: Recipient, emailType: string, subject: string, lines: string[]): Promise<void> {
  if (!to.email) {
    console.log(`[email] ${emailType} skipped: user ${to.userId} has no email`);
    return;
  }
  const text = lines.join("\n\n");
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email] (not sent, SMTP not configured) to=${to.email} subject="${subject}"\n${text}`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: to.email, subject, text });
    await storage.insertEmailLog({ userId: to.userId, emailType, recipientEmail: to.email }).catch(() => {});
  } catch (err: any) {
    console.error(`[email] ${emailType} to ${to.email} failed:`, err.message);
  }
}

const money = (n: number | string) => `$${Number(n).toFixed(2)}`;

export function orderStatusUrl(token: string): string {
  return `${getAppOrigin()}/order/${token}`;
}

export async function emailOfferReceived(artist: Recipient, artworkTitle: string, amount: string) {
  await send(artist, "offer_received", `New offer on "${artworkTitle}"`, [
    `Someone offered ${money(amount)} for "${artworkTitle}".`,
    `Accept or decline it from your dashboard within ${OFFER_WINDOW_HOURS} hours: ${getAppOrigin()}/dashboard`,
  ]);
}

export async function emailOfferAccepted(buyer: Recipient, artworkTitle: string, amount: string, artworkId: number) {
  await send(buyer, "offer_accepted", `Your offer on "${artworkTitle}" was accepted`, [
    `The artist accepted your ${money(amount)} offer for "${artworkTitle}".`,
    `Complete your purchase within ${OFFER_WINDOW_HOURS} hours: ${getAppOrigin()}/artwork/${artworkId}`,
  ]);
}

export async function emailOfferDeclined(buyer: Recipient, artworkTitle: string, artworkId: number) {
  await send(buyer, "offer_declined", `Your offer on "${artworkTitle}"`, [
    `The artist declined your offer for "${artworkTitle}". The piece is still available at its listed price: ${getAppOrigin()}/artwork/${artworkId}`,
  ]);
}

export async function emailOrderConfirmed(buyer: Recipient, artworkTitle: string, total: string, token: string) {
  await send(buyer, "order_confirmed", `Order confirmed: "${artworkTitle}"`, [
    `Thank you for supporting a student artist. Your payment of ${money(total)} for "${artworkTitle}" went through.`,
    `Track your order here (no login needed): ${orderStatusUrl(token)}`,
    `After it arrives you have ${INSPECTION_DAYS} days to report a problem before the artist is paid.`,
  ]);
}

export async function emailArtistSold(artist: Recipient, artworkTitle: string, shipTo: string, whiteGlove: boolean) {
  await send(artist, "order_sold", `You sold "${artworkTitle}"!`, [
    `"${artworkTitle}" just sold. Please pack it carefully and ship it within 5 days.`,
    `Ship to:\n${shipTo}`,
    whiteGlove
      ? `This piece needs white-glove shipping. BrushBids will contact you to arrange pickup; please don't ship it yourself.`
      : `Print your prepaid, insured label (or add your own tracking number) from your dashboard: ${getAppOrigin()}/dashboard`,
    `You'll be paid after the buyer receives it and the ${INSPECTION_DAYS}-day inspection window passes.`,
  ]);
}

export async function emailOrderShipped(buyer: Recipient, artworkTitle: string, trackingUrl: string | null, token: string) {
  await send(buyer, "order_shipped", `"${artworkTitle}" has shipped`, [
    `Your artwork is on its way.${trackingUrl ? ` Track the package: ${trackingUrl}` : ""}`,
    `Order status: ${orderStatusUrl(token)}`,
  ]);
}

export async function emailOrderIssue(adminEmail: string | undefined, orderId: number, note: string) {
  if (!adminEmail) return;
  await send({ userId: "admin", email: adminEmail }, "order_issue", `Order #${orderId}: buyer reported a problem`, [
    note, `Review it in the admin Orders tab: ${getAppOrigin()}/admin`,
  ]);
}

export async function emailArtistPaid(artist: Recipient, artworkTitle: string, amount: string, manual: boolean) {
  await send(artist, "order_paid_out", `Payment released for "${artworkTitle}"`, [
    manual
      ? `Your ${money(amount)} for "${artworkTitle}" has been approved and will be sent to your payout method shortly.`
      : `${money(amount)} for "${artworkTitle}" was sent to your Stripe account.`,
  ]);
}
