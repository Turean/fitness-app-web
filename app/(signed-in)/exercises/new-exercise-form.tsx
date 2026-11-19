"use client"

import { Plus } from "lucide-react"
import { useActionState, useId, useState } from "react"

import { createExercise, type CreateExerciseState } from "@/app/actions/exercises"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MUSCLE_GROUPS } from "@/lib/muscle-groups"
import { useSubmitGuard } from "@/lib/use-submit-guard"

type FormState = CreateExerciseState & { attempt?: number }

export function NewExerciseForm({
    sessionId,
    startOpen,
}: {
    sessionId: number | null
    startOpen: boolean
}) {
    const [open, setOpen] = useState(startOpen)
    const [state, formAction, pending] = useActionState<FormState, FormData>(
        async (prev, formData) => {
            const result = await createExercise(sessionId, prev, formData)
            return { ...result, attempt: (prev.attempt ?? 0) + 1 }
        },
        {},
    )
    const guard = useSubmitGuard(pending)

    if (!open) {
        return (
            <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(true)}
                className="h-14 w-full text-base"
            >
                <Plus />
                New exercise
            </Button>
        )
    }

    return (
        <form
            action={formAction}
            onSubmit={guard}
            className="flex flex-col gap-4 rounded-lg border p-4"
        >
            <h2 className="font-semibold">New exercise</h2>

            <Fields
                key={state.attempt ?? 0}
                defaults={state.values}
                autoFocus={!startOpen}
            />

            {state.error && (
                <p role="alert" className="text-sm text-destructive">
                    {state.error}
                </p>
            )}
            {state.created && (
                <p role="status" className="text-sm text-muted-foreground">
                    Added {state.created} to your library.
                </p>
            )}

            <div className="flex gap-2">
                {!startOpen && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="h-12 flex-1 text-base"
                    >
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={pending} className="h-12 flex-2 text-base">
                    {pending
                        ? "Adding…"
                        : sessionId === null
                          ? "Add to library"
                          : "Add to library and session"}
                </Button>
            </div>
        </form>
    )
}

const selectClass =
    "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

// Uncontrolled on purpose: React's post-action reset sends a controlled
// <select> to its first option. The `key` above restores what was sent.
function Fields({
    defaults,
    autoFocus,
}: {
    defaults?: { name: string; muscleGroup: string }
    autoFocus: boolean
}) {
    const id = useId()

    return (
        <>
            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-name`}>Name</Label>
                <Input
                    id={`${id}-name`}
                    name="name"
                    autoCapitalize="words"
                    autoFocus={autoFocus}
                    defaultValue={defaults?.name}
                    placeholder="e.g. Cable fly"
                    required
                    className="h-11 text-base"
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-group`}>Muscle group</Label>
                <select
                    id={`${id}-group`}
                    name="muscleGroup"
                    defaultValue={defaults?.muscleGroup ?? ""}
                    required
                    className={selectClass}
                >
                    <option value="" disabled>
                        Choose…
                    </option>
                    {MUSCLE_GROUPS.map((group) => (
                        <option key={group} value={group}>
                            {group}
                        </option>
                    ))}
                </select>
            </div>
        </>
    )
}
