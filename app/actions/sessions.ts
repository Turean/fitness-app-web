"use server"

import { refresh } from "next/cache"

import { api, ApiError } from "@/lib/api"
import { isSessionType } from "@/lib/session-types"
import type { Session } from "@/lib/types"

export type CreateSessionState = {
    error?: string
}

export async function createSession(
    _prev: CreateSessionState,
    formData: FormData,
): Promise<CreateSessionState> {
    const sessionType = formData.get("sessionType")

    if (!isSessionType(sessionType)) {
        return { error: "choose push, pull or legs" }
    }

    try {
        await api<Session>("/sessions", {
            method: "POST",
            body: { sessionType },
        })
    } catch (e) {
        if (e instanceof ApiError) {
            return { error: e.message }
        }
        throw e
    }

    refresh()
    return {}
}
