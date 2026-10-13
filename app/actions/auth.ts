"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { api, ApiError } from "@/lib/api"
import type { AuthResponse } from "@/lib/types"

export type LoginState = {
    error?: string
    username?: string
}

const THIRTY_DAYS = 60 * 60 * 24 * 30

export async function login(
    _prev: LoginState,
    formData: FormData,
): Promise<LoginState> {
    const username = formData.get("username")
    const password = formData.get("password")

    if (typeof username !== "string" || typeof password !== "string") {
        return { error: "username and password required" }
    }

    let result: AuthResponse

    try {
        result = await api<AuthResponse>("/login", {
            method: "POST",
            body: { username, password },
            auth: false,
        })
    } catch (e) {
        if (e instanceof ApiError) {
            return { error: e.message, username }
        }
        throw e
    }

    const cookieStore = await cookies()
    cookieStore.set("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: THIRTY_DAYS,
    })

    redirect("/sessions")
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete("token")
    redirect("/login")
}
