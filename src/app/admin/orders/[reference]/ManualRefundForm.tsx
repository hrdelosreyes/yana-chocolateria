"use client";

import { useActionState } from "react";
import { markRefundedAction } from "../../actions";

export function ManualRefundForm({ reference, amount }: { reference: string; amount: string }) {
  const [state, action, pending] = useActionState(markRefundedAction, null);
  return (
    <form action={action} className="admin-form manual-refund">
      <input type="hidden" name="reference" value={reference} />
      <h3>Refunded outside HitPay?</h3>
      <p className="muted">
        For payments HitPay can&apos;t refund (often GCash or QR Ph): send the {amount} back to the customer yourself, then
        record it here. This cancels the order and emails the customer.
      </p>
      <label className="check">
        <input type="checkbox" name="confirm" />
        I&apos;ve refunded {amount} to the customer
      </label>
      {state?.error && <p className="error">{state.error}</p>}
      <button className="button" disabled={pending}>
        {pending ? "Saving…" : "Mark as refunded"}
      </button>
    </form>
  );
}
