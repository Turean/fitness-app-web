"use client"

import { Check, Plus } from "lucide-react"
import Link from "next/link"
import { type FormEvent, useActionState, useState } from "react"

import { addExercise } from "@/app/actions/workoutExercises"
import { ExerciseGroup } from "@/components/exercise-group"
import type { ExerciseGroups } from "@/lib/exercise-groups"
import { useSubmitGuard } from "@/lib/use-submit-guard"

const rowClass = "flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"

// One form, with each row a submit button carrying its exercise id. Rows
// already in the session link to their logging screen instead.
export function AddToSessionList({
    sessionId,
    groups,
    inSession,
}: {
    sessionId: number
    groups: ExerciseGroups
    inSession: Record<number, number>
}) {
    const [state, formAction, pending] = useActionState(
        addExercise.bind(null, sessionId),
        {},
    )
    const guard = useSubmitGuard(pending)
    const [chosen, setChosen] = useState<string | null>(null)

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        guard(event)
        const submitter = (event.nativeEvent as SubmitEvent).submitter
        if (!event.defaultPrevented && submitter instanceof HTMLButtonElement) {
            setChosen(submitter.value)
        }
    }

    return (
        <form action={formAction} onSubmit={onSubmit} className="flex flex-col gap-6">
            {state.error && (
                <p role="alert" className="text-sm text-destructive">
                    {state.error}
                </p>
            )}

            {groups.map((group) => (
                <ExerciseGroup
                    key={group.muscleGroup}
                    muscleGroup={group.muscleGroup}
                    count={group.exercises.length}
                >
                    {group.exercises.map((exercise) => {
                        const workoutExerciseId = inSession[exercise.id]

                        return (
                            <li key={exercise.id}>
                                {workoutExerciseId ? (
                                    <Link
                                        href={`/sessions/${sessionId}/exercises/${workoutExerciseId}`}
                                        className={`${rowClass} transition-colors hover:bg-muted/50 active:bg-muted`}
                                    >
                                        <span className="font-medium">{exercise.name}</span>
                                        <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                                            <Check className="size-4" />
                                            In session
                                        </span>
                                    </Link>
                                ) : (
                                    <button
                                        type="submit"
                                        name="exerciseId"
                                        value={exercise.id}
                                        disabled={pending}
                                        className={`${rowClass} transition-colors hover:bg-muted/50 active:bg-muted disabled:cursor-default`}
                                    >
                                        <span className="font-medium">{exercise.name}</span>
                                        {pending && chosen === String(exercise.id) ? (
                                            <span className="shrink-0 text-sm text-muted-foreground">
                                                Adding…
                                            </span>
                                        ) : (
                                            <Plus className="size-4 shrink-0 text-muted-foreground" />
                                        )}
                                    </button>
                                )}
                            </li>
                        )
                    })}
                </ExerciseGroup>
            ))}
        </form>
    )
}
