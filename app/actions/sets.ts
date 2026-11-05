"use server"

import { refresh } from "next/cache"

import { api, ApiError } from "@/lib/api"
import { readNumber, readString } from "@/lib/form-data"
import type { WorkoutSet } from "@/lib/types"

export type AddSetState = {
    error?: string
    values?: { reps: string; weight: string }
}

export async function addSet(
    workoutExerciseId: number,
    _prev: AddSetState,
    formData: FormData,
): Promise<AddSetState> {
    const reps = readNumber(formData, "reps")
    const weight = readNumber(formData, "weight")
    const values = {
        reps: readString(formData, "reps"),
        weight: readString(formData, "weight"),
    }

    if (!Number.isInteger(workoutExerciseId) || workoutExerciseId <= 0) {
        return { error: "exercise not found", values }
    }

    try {
        await api<WorkoutSet>(`/workoutExercises/${workoutExerciseId}/sets`, {
            method: "POST",
            body: { reps, weight },
        })
    } catch (e) {
        if (e instanceof ApiError) {
            return { error: e.message, values }
        }
        throw e
    }

    refresh()
    return {}
}
