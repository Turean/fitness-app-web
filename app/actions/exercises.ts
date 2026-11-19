"use server"

import { refresh } from "next/cache"
import { redirect } from "next/navigation"

import { api, ApiError } from "@/lib/api"
import { readString } from "@/lib/form-data"
import { isMuscleGroup } from "@/lib/muscle-groups"
import type { Exercise, WorkoutExercise } from "@/lib/types"

export type CreateExerciseState = {
    error?: string
    created?: string
    values?: { name: string; muscleGroup: string }
}

// With a sessionId, the new exercise is also added to that session and the
// user lands on its logging screen; without one it only joins the library.
export async function createExercise(
    sessionId: number | null,
    _prev: CreateExerciseState,
    formData: FormData,
): Promise<CreateExerciseState> {
    const values = {
        name: readString(formData, "name").trim(),
        muscleGroup: readString(formData, "muscleGroup"),
    }
    const fail = (error: string) => ({ error, values })

    if (sessionId !== null && (!Number.isInteger(sessionId) || sessionId <= 0)) {
        return fail("session not found")
    }
    if (values.name === "") {
        return fail("Give the exercise a name.")
    }
    if (!isMuscleGroup(values.muscleGroup)) {
        return fail("Choose a muscle group.")
    }

    let exercise: Exercise

    try {
        exercise = await api<Exercise>("/exercises", {
            method: "POST",
            body: values,
        })
    } catch (e) {
        if (e instanceof ApiError) {
            return fail(e.message)
        }
        throw e
    }

    if (sessionId === null) {
        refresh()
        return { created: exercise.name }
    }

    let workoutExercise: WorkoutExercise

    try {
        workoutExercise = await api<WorkoutExercise>(
            `/sessions/${sessionId}/workoutExercises`,
            { method: "POST", body: { exerciseId: exercise.id } },
        )
    } catch (e) {
        if (e instanceof ApiError) {
            refresh()
            return { error: `${exercise.name} is in your library now, but ${e.message}.` }
        }
        throw e
    }

    redirect(`/sessions/${sessionId}/exercises/${workoutExercise.id}`)
}
