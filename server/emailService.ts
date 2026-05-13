import nodemailer from "nodemailer";

function getTransporter() {
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
}
