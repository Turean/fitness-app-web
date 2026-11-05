"use client"

import { useActionState } from "react"

import { createSession, type CreateSessionState } from "@/app/actions/sessions"
import { ExercisePicker } from "@/components/exercise-picker"
import { Button } from "@/components/ui/button"
import type { ExerciseGroups } from "@/lib/exercise-groups"
import { SESSION_TYPES } from "@/lib/session-types"
import { useSubmitGuard } from "@/lib/use-submit-guard"

type Values = CreateSessionState["values"]
type FormState = CreateSessionState & { attempt?: number }

export function NewSessionForm({ groups }: { groups: ExerciseGroups }) {
    // React resets a form after every action, putting each field back to its
    // default. Re-mounting the fields after each failed attempt makes those
    // defaults what was just sent. The counter lives in the action's state so
    // it changes in the same update as the values.
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
            <Fields key={state.attempt ?? 0} groups={groups} values={state.values} />

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

function Fields({ groups, values }: { groups: ExerciseGroups; values: Values }) {
    return (
        <>
            <fieldset>
                <legend className="mb-3 text-sm font-medium">What are you training?</legend>
                <div className="grid grid-cols-3 gap-2">
                    {SESSION_TYPES.map((type) => (
                        <label key={type} className="relative">
                            <input
                                type="radio"
                                name="sessionType"
                                value={type}
                                required
                                defaultChecked={values?.sessionType === type}
                                className="peer sr-only"
                            />
                            <span className="flex h-16 cursor-pointer items-center justify-center rounded-lg border text-base font-semibold transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                                {type}
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <fieldset>
                <legend className="mb-3 text-sm font-medium">First exercise</legend>
                <ExercisePicker groups={groups} defaults={values} />
            </fieldset>
        </>
    )
}
