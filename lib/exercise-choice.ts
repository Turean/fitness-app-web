import "server-only"

import { api, ApiError } from "@/lib/api"
import { readString } from "@/lib/form-data"
import { isMuscleGroup } from "@/lib/muscle-groups"
import type { Exercise } from "@/lib/types"

export type ExerciseChoice = {
    exercise: string
    newName: string
    newMuscleGroup: string
}

export function readExerciseChoice(formData: FormData): ExerciseChoice {
    return {
        exercise: readString(formData, "exercise"),
        newName: readString(formData, "newName").trim(),
        newMuscleGroup: readString(formData, "newMuscleGroup"),
    }
}

// The id to use, creating the exercise first when the user typed in a new one.
export async function resolveExercise(
    choice: ExerciseChoice,
): Promise<{ id: number } | { error: string }> {
    if (choice.exercise === "new") {
        if (choice.newName === "" || !isMuscleGroup(choice.newMuscleGroup)) {
            return { error: "Give the new exercise a name and a muscle group." }
        }
        try {
            const exercise = await api<Exercise>("/exercises", {
                method: "POST",
                body: { name: choice.newName, muscleGroup: choice.newMuscleGroup },
            })
            return { id: exercise.id }
        } catch (e) {
            if (e instanceof ApiError) {
                return { error: e.message }
            }
            throw e
        }
    }

    const id = Number(choice.exercise)
    if (!Number.isInteger(id) || id <= 0) {
        return { error: "Choose an exercise." }
    }
    return { id }
}
