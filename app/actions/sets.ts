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

    if (!isId(workoutExerciseId)) {
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

export type EditSetState = AddSetState & { done?: boolean }

export async function updateSet(
    workoutExerciseId: number,
    setId: number,
    _prev: EditSetState,
    formData: FormData,
): Promise<EditSetState> {
    const reps = readNumber(formData, "reps")
    const weight = readNumber(formData, "weight")
    const values = {
        reps: readString(formData, "reps"),
        weight: readString(formData, "weight"),
    }

    if (!isId(workoutExerciseId) || !isId(setId)) {
        return { error: "set not found", values }
    }

    try {
        await api<WorkoutSet>(`/workoutExercises/${workoutExerciseId}/sets/${setId}`, {
            method: "PATCH",
            body: { reps, weight },
        })
    } catch (e) {
        if (e instanceof ApiError) {
            return { error: e.message, values }
        }
        throw e
    }

    refresh()
    return { done: true }
}

export type DeleteSetState = { error?: string; done?: boolean }

export async function deleteSet(
    workoutExerciseId: number,
    setId: number,
): Promise<DeleteSetState> {
    if (!isId(workoutExerciseId) || !isId(setId)) {
        return { error: "set not found" }
    }

    try {
        await api<WorkoutSet>(`/workoutExercises/${workoutExerciseId}/sets/${setId}`, {
            method: "DELETE",
        })
    } catch (e) {
        if (e instanceof ApiError) {
            return { error: e.message }
        }
        throw e
    }

    refresh()
    return { done: true }
}

function isId(value: number) {
    return Number.isInteger(value) && value > 0
}
