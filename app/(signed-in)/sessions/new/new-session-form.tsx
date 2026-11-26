"use client"

import { useActionState } from "react"

import { createSession, type CreateSessionState } from "@/app/actions/sessions"
import { SessionTypeChoice } from "@/components/session-type-choice"
import { Button } from "@/components/ui/button"
import { useSubmitGuard } from "@/lib/use-submit-guard"

type FormState = CreateSessionState & { attempt?: number }

export function NewSessionForm() {
    // React resets a form after every action; re-mounting the fields with the
    // values just sent keeps the chosen type after an error.
    const [state, formAction, pending] = useActionState<FormState, FormData>(
        async (prev, formData) => {
            const result = await createSession(prev, formData)
            return { ...result, attempt: (prev.attempt ?? 0) + 1 }
        },
        {},
    )

    const guard = useSubmitGuard(pending)

    return (
        <form action={formAction} onSubmit={guard} className="flex flex-col gap-8">
            <SessionTypeChoice
                key={state.attempt ?? 0}
                legend="What are you training?"
                defaultValue={state.values?.sessionType}
            />

            {state.error && (
                <p role="alert" className="-mt-4 text-sm text-destructive">
                    {state.error}
                </p>
            )}

            <Button type="submit" disabled={pending} className="h-14 w-full text-base">
                {pending ? "Starting…" : "Start session"}
            </Button>
        </form>
    )
}
