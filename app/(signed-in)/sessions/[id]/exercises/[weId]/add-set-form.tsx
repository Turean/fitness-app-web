"use client"

import { useActionState, useId } from "react"

import { addSet, type AddSetState } from "@/app/actions/sets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSubmitGuard } from "@/lib/use-submit-guard"

type FormState = AddSetState & { attempt?: number }

export function AddSetForm({
    workoutExerciseId,
    setCount,
    lastSet,
}: {
    workoutExerciseId: number
    setCount: number
    lastSet?: { reps: number; weight: number }
}) {
    const [state, formAction, pending] = useActionState<FormState, FormData>(
        async (prev, formData) => {
            const result = await addSet(workoutExerciseId, prev, formData)
            return { ...result, attempt: (prev.attempt ?? 0) + 1 }
        },
        {},
    )
    const guard = useSubmitGuard(pending)

    // After a set is logged, start from it — most sets repeat the last one.
    // After an error, keep what was typed.
    const defaults = state.error
        ? state.values
        : lastSet && { reps: String(lastSet.reps), weight: String(lastSet.weight) }

    return (
        <form action={formAction} onSubmit={guard} className="flex flex-col gap-3">
            <Fields key={`${setCount}-${state.attempt ?? 0}`} defaults={defaults} />

            {state.error && (
                <p role="alert" className="text-sm text-destructive">
                    {state.error}
                </p>
            )}

            <Button type="submit" disabled={pending} className="h-14 w-full text-base">
                {pending ? "Adding…" : `Add set ${setCount + 1}`}
            </Button>
        </form>
    )
}

function Fields({ defaults }: { defaults?: { reps: string; weight: string } }) {
    const id = useId()

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-reps`}>Reps</Label>
                <Input
                    id={`${id}-reps`}
                    name="reps"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    defaultValue={defaults?.reps}
                    required
                    className="h-14 text-center text-xl tabular-nums"
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-weight`}>Weight (kg)</Label>
                <Input
                    id={`${id}-weight`}
                    name="weight"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    defaultValue={defaults?.weight}
                    placeholder="0 = BW"
                    required
                    className="h-14 text-center text-xl tabular-nums"
                />
            </div>
        </div>
    )
}
