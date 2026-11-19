"use server"

import { redirect } from "next/navigation"

import { api, ApiError } from "@/lib/api"
import { readString } from "@/lib/form-data"
import { isSessionType } from "@/lib/session-types"
import type { Session } from "@/lib/types"

export type CreateSessionState = {
    error?: string
    values?: { sessionType: string }
}

export async function createSession(
    _prev: CreateSessionState,
    formData: FormData,
): Promise<CreateSessionState> {
    const values = { sessionType: readString(formData, "sessionType") }

    if (!isSessionType(values.sessionType)) {
        return { error: "Choose push, pull or legs.", values }
    }

    let session: Session

    try {
        session = await api<Session>("/sessions", {
            method: "POST",
            body: { sessionType: values.sessionType },
        })
    } catch (e) {
        if (e instanceof ApiError) {
            return { error: e.message, values }
        }
        throw e
    }

    redirect(`/sessions/${session.id}`)
}
