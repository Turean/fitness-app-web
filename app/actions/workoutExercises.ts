"use server"

import { redirect } from "next/navigation"

import { api, ApiError } from "@/lib/api"
import { readString } from "@/lib/form-data"
import type { WorkoutExercise } from "@/lib/types"

export type AddExerciseState = {
    error?: string
}

// The library's rows are submit buttons named exerciseId, so the tapped
// row's id arrives in the form data.
export async function addExercise(
    sessionId: number,
    _prev: AddExerciseState,
    formData: FormData,
): Promise<AddExerciseState> {
    const exerciseId = Number(readString(formData, "exerciseId"))

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        return { error: "session not found" }
    }
    if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
        return { error: "Choose an exercise." }
    }

    let workoutExercise: WorkoutExercise

    try {
        workoutExercise = await api<WorkoutExercise>(
            `/sessions/${sessionId}/workoutExercises`,
            { method: "POST", body: { exerciseId } },
        )
    } catch (e) {
        if (e instanceof ApiError) {
            return { error: e.message }
        }
        throw e
    }

    redirect(`/sessions/${sessionId}/exercises/${workoutExercise.id}`)
}
