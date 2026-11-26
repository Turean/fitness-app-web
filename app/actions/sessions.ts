"use server"

import { refresh } from "next/cache"
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

export type EditSessionState = {
    error?: string
    done?: boolean
    values?: { sessionType: string; note: string }
}

export async function updateSession(
    sessionId: number,
    _prev: EditSessionState,
    formData: FormData,
): Promise<EditSessionState> {
    const values = {
        sessionType: readString(formData, "sessionType"),
        note: readString(formData, "note"),
    }

    if (!isId(sessionId)) {
        return { error: "session not found", values }
    }
    if (!isSessionType(values.sessionType)) {
        return { error: "Choose push, pull or legs.", values }
    }

    // The API takes null, not "", for no note, so clearing the field
    // removes the note.
    const note = values.note.trim() === "" ? null : values.note.trim()

    try {
        await api<Session>(`/sessions/${sessionId}`, {
            method: "PATCH",
            body: { sessionType: values.sessionType, note },
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

export async function deleteSession(sessionId: number): Promise<{ error?: string }> {
    if (!isId(sessionId)) {
        return { error: "session not found" }
    }

    try {
        await api<Session>(`/sessions/${sessionId}`, { method: "DELETE" })
    } catch (e) {
        if (e instanceof ApiError) {
            return { error: e.message }
        }
        throw e
    }

    redirect("/")
}

function isId(value: number) {
    return Number.isInteger(value) && value > 0
}
