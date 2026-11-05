"use server"

import { redirect } from "next/navigation"

import { api, ApiError } from "@/lib/api"
import { type ExerciseChoice, readExerciseChoice, resolveExercise } from "@/lib/exercise-choice"
import { readString } from "@/lib/form-data"
import { isSessionType } from "@/lib/session-types"
import type { Session, WorkoutExercise } from "@/lib/types"

export type CreateSessionState = {
    error?: string
    values?: ExerciseChoice & { sessionType: string }
}

export async function createSession(
    _prev: CreateSessionState,
    formData: FormData,
): Promise<CreateSessionState> {
    const values = {
        sessionType: readString(formData, "sessionType"),
        ...readExerciseChoice(formData),
    }
    const fail = (error: string) => ({ error, values })

    if (!isSessionType(values.sessionType)) {
        return fail("Choose push, pull or legs.")
    }

    const exercise = await resolveExercise(values)
    if ("error" in exercise) {
        return fail(exercise.error)
    }

    let session: Session

    try {
        session = await api<Session>("/sessions", {
            method: "POST",
            body: { sessionType: values.sessionType },
        })
    } catch (e) {
        if (e instanceof ApiError) {
            return fail(e.message)
        }
        throw e
    }

    let workoutExercise: WorkoutExercise

    try {
        workoutExercise = await api<WorkoutExercise>(
            `/sessions/${session.id}/workoutExercises`,
            { method: "POST", body: { exerciseId: exercise.id } },
        )
    } catch (e) {
        // Two API calls make one session; don't leave the first behind if
        // the second fails.
        await api(`/sessions/${session.id}`, { method: "DELETE" }).catch(() => {})
        if (e instanceof ApiError) {
            return fail(e.message)
        }
        throw e
    }

    redirect(`/sessions/${session.id}/exercises/${workoutExercise.id}`)
}
