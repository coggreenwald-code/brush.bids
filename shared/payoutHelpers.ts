import type { User } from "./models/auth";

export type PayoutMethod = "paypal" | "venmo" | "zelle";

// Compute completed years between dob and today. Returns null if dob is missing
// or unparseable.
export function ageInYears(dob: string | Date | null | undefined, today: Date = new Date()): number | null {
  if (!dob) return null;
  const d = typeof dob === "string" ? new Date(dob + "T00:00:00") : dob;
  if (isNaN(d.getTime())) return null;
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const m = today.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

export function isMinor(user: Pick<User, "dateOfBirth">): boolean {
  const age = ageInYears(user.dateOfBirth as any);
  return age !== null && age < 18;
}

// True if Stripe Connect is fully wired up and ready to receive transfers.
export function hasStripeConnectReady(
  user: Pick<User, "stripeAccountId" | "stripeOnboardingComplete" | "stripePayoutsEnabled">,
): boolean {
  return !!user.stripeAccountId && !!user.stripeOnboardingComplete && !!user.stripePayoutsEnabled;
}

// True if there's a working parent/guardian payout target on file (handle +
// method + seller-terms acceptance). Used for both current minors AND adults
// who originally onboarded as minors and haven't switched their own handle on
// yet — turning 18 should not silently invalidate an existing payout route.
function hasParentPayoutReady(user: User): boolean {
  return !!(
    user.parentGuardianEmail &&
    user.parentPayoutMethod &&
    user.parentPayoutHandle &&
    user.parentTermsAcceptedAt
  );
}

// True if the artist (or their guardian, if a minor) has at least *some* way
// for us to pay them on a sale: Stripe Connect ready, OR their own manual
// handle (PayPal/Venmo/Zelle), OR a parent/guardian handle on file. Minors
// MUST have the parent path; adults may use either their own or a still-
// valid parent path inherited from when they were a minor (the
// `adultUpgradeAvailable` flag in the API drives the "switch to your own
// handle" prompt).
export function hasReadyPayout(user: User): boolean {
  if (hasStripeConnectReady(user)) return true;
  if (isMinor(user)) return hasParentPayoutReady(user);
  // Adult (or unknown DOB): prefer their own handle, fall back to parent
  // path if it was set up before they turned 18 and they haven't migrated yet.
  if (user.payoutMethod && user.payoutHandle) return true;
  return hasParentPayoutReady(user);
}

// Which payout path (and recipient handle/email) we'll use when an auction
// settles for this artist. Returns null if nothing is set.
export type PayoutTarget =
  | { kind: "stripe" }
  | {
      kind: "manual";
      method: PayoutMethod;
      handle: string;
      // For minors: the parent/guardian's email so we can also notify them.
      recipientEmail: string | null;
      forMinor: boolean;
    };

export function resolvePayoutTarget(user: User): PayoutTarget | null {
  if (hasStripeConnectReady(user)) return { kind: "stripe" };
  const minor = isMinor(user);
  // Minors: parent path only.
  if (minor) {
    if (!hasParentPayoutReady(user)) return null;
    return {
      kind: "manual",
      method: user.parentPayoutMethod as PayoutMethod,
      handle: user.parentPayoutHandle as string,
      recipientEmail: user.parentGuardianEmail ?? null,
      forMinor: true,
    };
  }
  // Adults: prefer own handle, fall back to existing parent path so an artist
  // who turns 18 mid-listing keeps getting paid until they explicitly switch.
  if (user.payoutMethod && user.payoutHandle) {
    return {
      kind: "manual",
      method: user.payoutMethod as PayoutMethod,
      handle: user.payoutHandle,
      recipientEmail: user.email ?? null,
      forMinor: false,
    };
  }
  if (hasParentPayoutReady(user)) {
    return {
      kind: "manual",
      method: user.parentPayoutMethod as PayoutMethod,
      handle: user.parentPayoutHandle as string,
      recipientEmail: user.parentGuardianEmail ?? null,
      // forMinor reflects WHO is being paid here (the parent), not the
      // artist's current age — it drives admin-tab labeling and email cc.
      forMinor: true,
    };
  }
  return null;
}
