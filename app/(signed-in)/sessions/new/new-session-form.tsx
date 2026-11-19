"use client"

import { useActionState } from "react"

import { createSession, type CreateSessionState } from "@/app/actions/sessions"
import { Button } from "@/components/ui/button"
import { SESSION_TYPES } from "@/lib/session-types"
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
            <fieldset key={state.attempt ?? 0}>
                <legend className="mb-3 text-sm font-medium">What are you training?</legend>
                <div className="grid grid-cols-3 gap-2">
                    {SESSION_TYPES.map((type) => (
                        <label key={type} className="relative">
                            <input
                                type="radio"
                                name="sessionType"
                                value={type}
                                required
                                defaultChecked={state.values?.sessionType === type}
                                className="peer sr-only"
                            />
                            <span className="flex h-16 cursor-pointer items-center justify-center rounded-lg border text-base font-semibold transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                                {type}
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>

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
