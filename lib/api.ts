import "server-only"

import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message)
    }
}

type Options = {
    method?: "GET" | "POST" | "PATCH" | "DELETE"
    body?: unknown
    auth?: boolean
}

export async function api<T>(
    path: string,
    { method = "GET", body, auth = true }: Options = {},
): Promise<T> {
    const baseUrl = process.env.API_URL

    if (!baseUrl) {
        throw new Error("API_URL is not set — copy .env.example to .env.local")
    }

    const token = auth ? (await cookies()).get("token")?.value : undefined

    const headers: Record<string, string> = {}

    if (body !== undefined) {
        headers["Content-Type"] = "application/json"
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }

    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
    })

    // Cookies can't be deleted while a page renders, so a route handler does it.
    if (res.status === 401 && auth) {
        redirect("/signout")
    }

    if (res.status === 404 && method === "GET") {
        notFound()
    }

    const data = await res.json()

    if (!res.ok) {
        throw new ApiError(res.status, data.msg ?? "something went wrong")
    }

    return data as T
}
