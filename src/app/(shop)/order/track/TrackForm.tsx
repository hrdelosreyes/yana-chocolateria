"use client";

import { useFormAction } from "@/lib/use-form-action";
import { lookupOrderAction } from "./actions";

export function TrackForm({ reference }: { reference?: string }) {
  const [state, onSubmit, pending] = useFormAction(lookupOrderAction, null);
  return (
    <form onSubmit={onSubmit} className="checkout-form track-form">
      <label>
        Order number
        <input name="reference" defaultValue={reference} placeholder="YC-261105-ABC123" required autoCapitalize="characters" />
      </label>
      <label>
        Email or mobile number you ordered with
        <input name="contact" required autoComplete="email" />
      </label>
      {state?.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button className="button primary full" disabled={pending}>
        {pending ? "Looking up…" : "Track order"}
      </button>
    </form>
  );
}
