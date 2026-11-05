"use client";

import { useFormAction } from "@/lib/use-form-action";
import { cancelOrderAction } from "./actions";

export function CancelForm({ reference, token, amount }: { reference: string; token: string; amount: string }) {
  const [state, onSubmit, pending] = useFormAction(cancelOrderAction, null);
  return (
    <form onSubmit={onSubmit} className="checkout-form cancel-order">
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="token" value={token} />
      <h2>Need to cancel?</h2>
      <p className="muted">
        You can cancel for a full refund of {amount} until we start preparing your order. The refund goes back to your
        original payment method.
      </p>
      <label className="check">
        <input type="checkbox" name="confirm" />
        Yes, cancel my order and refund {amount}
      </label>
      {state?.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button className="button full" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel order"}
      </button>
    </form>
  );
}
