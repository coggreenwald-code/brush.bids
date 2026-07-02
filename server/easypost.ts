// EasyPost shipping rate integration.
// Uses the EasyPost REST API directly (no SDK) for real-time carrier quotes
// before Stripe Checkout opens. Supports USPS, FedEx, UPS, and DHL.

export type ShippingRate = {
  rateId: string;
  carrier: string;
  service: string;
  rate: number;             // USD, e.g. 12.50
  estimatedDays: number | null;
  deliveryDate: string | null; // ISO date string if provided by carrier
};

export type EasyPostRateOpts = {
  fromStreet: string;
  fromCity: string;
  fromState: string;
  fromZip: string;
  toStreet: string;
  toCity: string;
  toState: string;
  toZip: string;
  weightOz: number;
};

export async function getEasyPostRates(opts: EasyPostRateOpts): Promise<ShippingRate[]> {
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) {
    throw new Error("EASYPOST_API_KEY is not configured. Add your EasyPost API key in the Replit secrets tab.");
  }

  const body = {
    shipment: {
      from_address: {
        street1: opts.fromStreet,
        city: opts.fromCity,
        state: opts.fromState,
        zip: opts.fromZip,
        country: "US",
      },
      to_address: {
        street1: opts.toStreet,
        city: opts.toCity,
        state: opts.toState,
        zip: opts.toZip,
        country: "US",
      },
      parcel: {
        // Dimensions in inches — generous defaults for framed/packaged artwork
        length: 16,
        width: 14,
        height: 3,
        weight: opts.weightOz,
      },
    },
  };

  const encoded = Buffer.from(apiKey + ":").toString("base64");

  let resp: Response;
  try {
    resp = await fetch("https://api.easypost.com/v2/shipments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (netErr: any) {
    // Network-level failure reaching EasyPost (DNS, TLS, timeout). Log the real
    // cause so it's visible in deployment logs, not a generic error.
    console.error(`[easypost] network error calling EasyPost: ${netErr?.message || netErr}`);
    throw new Error(`Could not reach the shipping service: ${netErr?.message || "network error"}`);
  }

  if (!resp.ok) {
    // Surface the REAL EasyPost error (HTTP status + their error.message) both
    // in the server logs and to the caller, instead of a generic failure.
    const text = await resp.text();
    let apiMessage = text;
    try {
      const parsed = JSON.parse(text);
      apiMessage = parsed?.error?.message || parsed?.error || text;
      if (typeof apiMessage !== "string") apiMessage = JSON.stringify(apiMessage);
    } catch {
      /* body wasn't JSON — keep raw text */
    }
    console.error(`[easypost] API error ${resp.status}: ${apiMessage}`);
    throw new Error(`EasyPost API error ${resp.status}: ${apiMessage}`);
  }

  const data = await resp.json();
  const rates: ShippingRate[] = (data.rates || []).map((r: any) => ({
    rateId: r.id,
    carrier: r.carrier,
    service: r.service,
    rate: parseFloat(r.rate),
    estimatedDays: r.delivery_days ?? null,
    deliveryDate: r.delivery_date ?? null,
  }));

  // Sort cheapest first
  rates.sort((a, b) => a.rate - b.rate);
  return rates;
}
