"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="admin-form">
      <label>
        Password
        <input name="password" type="password" required autoComplete="current-password" autoFocus />
      </label>
      {state?.error && <p className="error">{state.error}</p>}
      <button className="button primary full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
