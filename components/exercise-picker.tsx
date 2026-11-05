"use client"

import { useId, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ExerciseGroups } from "@/lib/exercise-groups"
import { MUSCLE_GROUPS } from "@/lib/muscle-groups"

const selectClass =
    "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

// Every field is uncontrolled: React's post-action form reset sends a
// controlled <select> to its first option and never corrects it. Re-mount
// the picker with a `key` after a failed attempt to restore what was sent.
export function ExercisePicker({
    groups,
    defaults,
}: {
    groups: ExerciseGroups
    defaults?: { exercise?: string; newName?: string; newMuscleGroup?: string }
}) {
    const id = useId()
    const firstExercise = groups[0]?.exercises[0]
    const initialChoice =
        defaults?.exercise ?? (firstExercise ? String(firstExercise.id) : "new")
    const [choice, setChoice] = useState(initialChoice)

    return (
        <div className="flex flex-col gap-3">
            <Label htmlFor={`${id}-exercise`} className="sr-only">
                Exercise
            </Label>
            <select
                id={`${id}-exercise`}
                name="exercise"
                defaultValue={initialChoice}
                onChange={(event) => setChoice(event.target.value)}
                required
                className={selectClass}
            >
                {groups.map((group) => (
                    <optgroup key={group.muscleGroup} label={group.muscleGroup}>
                        {group.exercises.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>
                                {exercise.name}
                            </option>
                        ))}
                    </optgroup>
                ))}
                <option value="new">＋ New exercise…</option>
            </select>

            {choice === "new" && (
                <div className="flex flex-col gap-3 rounded-lg bg-muted p-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`${id}-new-name`}>Name</Label>
                        <Input
                            id={`${id}-new-name`}
                            name="newName"
                            autoCapitalize="words"
                            defaultValue={defaults?.newName}
                            placeholder="e.g. Cable fly"
                            required
                            className="h-11 bg-background"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`${id}-new-group`}>Muscle group</Label>
                        <select
                            id={`${id}-new-group`}
                            name="newMuscleGroup"
                            defaultValue={defaults?.newMuscleGroup ?? ""}
                            required
                            className={`${selectClass} bg-background`}
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
                </div>
            )}
        </div>
    )
}
