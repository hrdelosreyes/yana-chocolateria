"use client";

import { useActionState } from "react";
import { refundOrderAction } from "../../actions";

export function RefundForm({ reference, amount }: { reference: string; amount: string }) {
  const [state, action, pending] = useActionState(refundOrderAction, null);
  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="reference" value={reference} />
      <p>Refunds the full {amount} to the customer&apos;s original payment method and cancels the order.</p>
      <label className="check">
        <input type="checkbox" name="confirm" />
        Yes, refund {amount} to the customer
      </label>
      {state?.error && <p className="error">{state.error}</p>}
      <button className="button" disabled={pending}>
        {pending ? "Refunding…" : `Refund ${amount} via HitPay`}
      </button>
    </form>
  );
}
