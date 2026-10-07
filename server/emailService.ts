import nodemailer from "nodemailer";
import { storage } from "./storage";

export function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendPayoutReadyEmail(artist: {
  id: string;
  email: string | null | undefined;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
}): Promise<void> {
  if (!artist.email) {
    console.log("[email] Payout-ready notification skipped — artist has no email address");
    return;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log(
      "[email] Payout-ready notification skipped — SMTP_HOST/SMTP_USER/SMTP_PASS not configured. " +
      `Would have emailed: ${artist.email}`
    );
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const name = [artist.firstName, artist.lastName].filter(Boolean).join(" ") || "Artist";
  const dashboardUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/dashboard`
    : "https://brushbids.com/dashboard";

  await transporter.sendMail({
    from: `"BrushBids" <${from}>`,
    to: artist.email,
    subject: "Your BrushBids payout account is ready",
    text: [
      `Hi ${name},`,
      "",
      "Great news — your Stripe payout account has been verified and is now fully active.",
      "You can start listing artwork for auction on BrushBids right away, and earnings",
      "from sales will be paid out directly to your account.",
      "",
      `Head to your dashboard to get started: ${dashboardUrl}`,
      "",
      "Thanks for being part of BrushBids.",
      "— The BrushBids Team",
    ].join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#7c3aed">Your payout account is ready 🎉</h2>
        <p>Hi ${name},</p>
        <p>
          Great news — your Stripe payout account has been verified and is now fully active.
          You can start listing artwork for auction on BrushBids right away, and earnings
          from sales will be paid out directly to your account.
        </p>
        <p style="margin:32px 0">
          <a href="${dashboardUrl}"
             style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">
            Go to your dashboard
          </a>
        </p>
        <p style="color:#666;font-size:14px">Thanks for being part of BrushBids.<br>— The BrushBids Team</p>
      </div>
    `,
  });

  console.log(`[email] Payout-ready notification sent to ${artist.email}`);
  await storage.insertEmailLog({ userId: artist.id, emailType: "payout_ready", recipientEmail: artist.email })
    .catch(err => console.error("[email] Failed to write email log:", err));
}

export async function sendPayoutRestrictedEmail(artist: {
  id: string;
  email: string | null | undefined;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
}): Promise<void> {
  if (!artist.email) {
    console.log("[email] Payout-restricted notification skipped — artist has no email address");
    return;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log(
      "[email] Payout-restricted notification skipped — SMTP_HOST/SMTP_USER/SMTP_PASS not configured. " +
      `Would have emailed: ${artist.email}`
    );
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const name = [artist.firstName, artist.lastName].filter(Boolean).join(" ") || "Artist";
  const dashboardUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/dashboard`
    : "https://brushbids.com/dashboard";

  await transporter.sendMail({
    from: `"BrushBids" <${from}>`,
    to: artist.email,
    subject: "Action required: your BrushBids payout account needs attention",
    text: [
      `Hi ${name},`,
      "",
      "We wanted to let you know that your Stripe payout account has been restricted.",
      "This means payouts from artwork sales are currently on hold until the issue is resolved.",
      "",
      "To fix this, please visit your BrushBids dashboard and follow the prompts to",
      "update your payout account information with Stripe.",
      "",
      `Go to your dashboard: ${dashboardUrl}`,
      "",
      "If you have questions, feel free to reply to this email and we'll help you sort it out.",
      "",
      "Thanks for being part of BrushBids.",
      "— The BrushBids Team",
    ].join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#d97706">Action required: payout account needs attention</h2>
        <p>Hi ${name},</p>
        <p>
          We wanted to let you know that your Stripe payout account has been
          <strong>restricted</strong>. This means payouts from artwork sales are currently
          on hold until the issue is resolved.
        </p>
        <p>
          To fix this, please visit your BrushBids dashboard and follow the prompts to
          update your payout account information with Stripe.
        </p>
        <p style="margin:32px 0">
          <a href="${dashboardUrl}"
             style="background:#d97706;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600">
            Fix my payout account
          </a>
        </p>
        <p>
          If you have questions, feel free to reply to this email and we'll help you sort it out.
        </p>
        <p style="color:#666;font-size:14px">Thanks for being part of BrushBids.<br>— The BrushBids Team</p>
      </div>
    `,
  });

  console.log(`[email] Payout-restricted notification sent to ${artist.email}`);
  await storage.insertEmailLog({ userId: artist.id, emailType: "payout_restricted", recipientEmail: artist.email })
    .catch(err => console.error("[email] Failed to write email log:", err));
}

// Sent when an artist (or their parent) wins-out a manual-payout sale and we
// queue the off-Stripe transfer in the admin Pending Payouts tab. The artist
// always gets a copy; if it's a minor, the parent/guardian also gets one.
export async function sendManualPayoutQueuedEmail(opts: {
  artist: { id: string; email: string | null | undefined; firstName: string | null | undefined; lastName: string | null | undefined };
  parentEmail?: string | null;
  artworkTitle: string;
  amount: string;
  method: "paypal" | "venmo" | "zelle";
  handle: string;
  forMinor: boolean;
}): Promise<void> {
  const recipients = [opts.artist.email, opts.forMinor ? opts.parentEmail : null].filter(Boolean) as string[];
  if (recipients.length === 0) {
    console.log("[email] Manual-payout-queued notification skipped — no recipients");
    return;
  }
  const transporter = getTransporter();
  if (!transporter) {
    console.log(
      "[email] Manual-payout-queued notification skipped — SMTP not configured. Would have emailed: " +
      recipients.join(", ")
    );
    return;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const name = [opts.artist.firstName, opts.artist.lastName].filter(Boolean).join(" ") || "Artist";
  const methodLabel = opts.method.charAt(0).toUpperCase() + opts.method.slice(1);
  const text = [
    `Hi ${name},`,
    "",
    `Great news — your artwork "${opts.artworkTitle}" sold on BrushBids!`,
    "",
    `Your payout of $${opts.amount} will be sent to your ${methodLabel} (${opts.handle})`,
    "by the BrushBids team within 3 business days.",
    opts.forMinor ? "(Because you're under 18, this goes to your parent or guardian's account on file.)" : "",
    "",
    "Want faster, automatic payouts? You can connect a Stripe account anytime",
    "from your dashboard and future sales will be paid out instantly.",
    "",
    "Thanks for being part of BrushBids.",
    "— The BrushBids Team",
  ].filter(Boolean).join("\n");
  await transporter.sendMail({
    from: `"BrushBids" <${from}>`,
    to: recipients.join(", "),
    subject: `Your BrushBids sale — payout of $${opts.amount} queued`,
    text,
  });
  console.log(`[email] Manual-payout-queued notification sent to ${recipients.join(", ")}`);
  await storage.insertEmailLog({ userId: opts.artist.id, emailType: "manual_payout_queued", recipientEmail: recipients[0] })
    .catch(err => console.error("[email] Failed to write email log:", err));
}

// One-time email sent the first time an artist who originally signed up as a
// minor logs in after their 18th birthday, prompting them to switch payouts
// over to themselves.
export async function sendAdultUpgradeEmail(artist: {
  id: string;
  email: string | null | undefined;
  firstName: string | null | undefined;
  lastName: string | null | undefined;
}): Promise<void> {
  if (!artist.email) return;
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email] Adult-upgrade notification skipped — SMTP not configured. Would have emailed: ${artist.email}`);
    return;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const name = [artist.firstName, artist.lastName].filter(Boolean).join(" ") || "Artist";
  const dashboardUrl = process.env.APP_URL ? `${process.env.APP_URL}/dashboard` : "https://brushbids.com/dashboard";
  await transporter.sendMail({
    from: `"BrushBids" <${from}>`,
    to: artist.email,
    subject: "Happy 18th — you can now manage your own BrushBids payouts",
    text: [
      `Hi ${name},`,
      "",
      "Happy 18th birthday! Now that you're an adult, you can switch your BrushBids",
      "earnings over to your own payout account instead of your parent or guardian's.",
      "",
      "You can either add your own PayPal/Venmo/Zelle handle, or connect Stripe for",
      "automatic payouts, on your dashboard:",
      dashboardUrl,
      "",
      "— The BrushBids Team",
    ].join("\n"),
  });
  console.log(`[email] Adult-upgrade notification sent to ${artist.email}`);
  await storage.insertEmailLog({ userId: artist.id, emailType: "adult_upgrade", recipientEmail: artist.email })
    .catch(err => console.error("[email] Failed to write email log:", err));
}

// Sent when an artwork sells but the artist hasn't set up a payout method yet.
// Prompts them to add PayPal/Venmo/Zelle (or Stripe) so the admin can disburse.
export async function sendPayoutSetupNeededEmail(opts: {
  artist: { id: string; email: string | null | undefined; firstName: string | null | undefined; lastName: string | null | undefined };
  artworkTitle: string;
  amount: string;
}): Promise<void> {
  const { artist, artworkTitle, amount } = opts;
  if (!artist.email) {
    console.log("[email] Payout-setup-needed notification skipped — artist has no email");
    return;
  }

  const transporter = getTransporter();
  const dashboardUrl = `${process.env.APP_ORIGIN || "https://brushbids.com"}/dashboard`;
  const name = artist.firstName || "Artist";

  if (!transporter) {
    console.log(
      `[email] Payout-setup-needed notification skipped — SMTP not configured. ` +
      `Would have emailed: ${artist.email} — artwork "${artworkTitle}" sold for $${amount}`
    );
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from,
    to: artist.email,
    subject: `Your artwork sold — set up your payout to receive $${amount}`,
    text: [
      `Hi ${name},`,
      "",
      `Great news — your artwork "${artworkTitle}" sold! Your earnings of $${amount} are`,
      "being held safely by BrushBids.",
      "",
      "To receive your money, please add a payout method (PayPal, Venmo, or Zelle)",
      "on your Dashboard. It only takes a minute:",
      dashboardUrl,
      "",
      "Once you've added your handle, an admin will send your funds within 3–5",
      "business days. If you have any questions, reply to this email.",
      "",
      "— The BrushBids Team",
    ].join("\n"),
  });
  console.log(`[email] Payout-setup-needed notification sent to ${artist.email}`);
  await storage.insertEmailLog({ userId: artist.id, emailType: "payout_setup_needed", recipientEmail: artist.email })
    .catch(err => console.error("[email] Failed to write email log:", err));
}
