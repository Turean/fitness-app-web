"use client"

import { useActionState } from "react"

import { addExercise, type AddExerciseState } from "@/app/actions/workoutExercises"
import { ExercisePicker } from "@/components/exercise-picker"
import { Button } from "@/components/ui/button"
import type { ExerciseGroups } from "@/lib/exercise-groups"
import { useSubmitGuard } from "@/lib/use-submit-guard"

type FormState = AddExerciseState & { attempt?: number }

export function AddExerciseForm({
    sessionId,
    groups,
}: {
    sessionId: number
    groups: ExerciseGroups
}) {
    const [state, formAction, pending] = useActionState<FormState, FormData>(
        async (prev, formData) => {
            const result = await addExercise(sessionId, prev, formData)
            return { ...result, attempt: (prev.attempt ?? 0) + 1 }
        },
        {},
    )
    const guard = useSubmitGuard(pending)

    return (
        <form action={formAction} onSubmit={guard} className="flex flex-col gap-6">
            <fieldset>
                <legend className="mb-3 text-sm font-medium">Exercise</legend>
                <ExercisePicker
                    key={state.attempt ?? 0}
                    groups={groups}
                    defaults={state.values}
                />
            </fieldset>

            {state.error && (
                <p role="alert" className="-mt-2 text-sm text-destructive">
                    {state.error}
                </p>
            )}

            <Button type="submit" disabled={pending} className="h-14 w-full text-base">
                {pending ? "Adding…" : "Add exercise"}
            </Button>
        </form>
    )
}
