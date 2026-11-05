"use client";

import { startTransition, useActionState } from "react";

// Like useActionState, but submits through onSubmit so React doesn't clear the
// form's fields afterwards; a failed submission keeps what the person typed.
export function useFormAction<S>(action: (state: Awaited<S>, form: FormData) => S | Promise<S>, initial: Awaited<S>) {
  const [state, run, pending] = useActionState(action, initial);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(() => run(form));
  };
  return [state, onSubmit, pending] as const;
}
