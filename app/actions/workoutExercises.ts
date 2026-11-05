"use server"

import { redirect } from "next/navigation"

import { api, ApiError } from "@/lib/api"
import { type ExerciseChoice, readExerciseChoice, resolveExercise } from "@/lib/exercise-choice"
import type { WorkoutExercise } from "@/lib/types"

export type AddExerciseState = {
    error?: string
    values?: ExerciseChoice
}

export async function addExercise(
    sessionId: number,
    _prev: AddExerciseState,
    formData: FormData,
): Promise<AddExerciseState> {
    const values = readExerciseChoice(formData)

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        return { error: "session not found", values }
    }

    const exercise = await resolveExercise(values)
    if ("error" in exercise) {
        return { error: exercise.error, values }
    }

    let workoutExercise: WorkoutExercise

    try {
        workoutExercise = await api<WorkoutExercise>(
            `/sessions/${sessionId}/workoutExercises`,
            { method: "POST", body: { exerciseId: exercise.id } },
        )
    } catch (e) {
        if (e instanceof ApiError) {
            return { error: e.message, values }
        }
        throw e
    }

    redirect(`/sessions/${sessionId}/exercises/${workoutExercise.id}`)
}
