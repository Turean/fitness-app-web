import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { SessionSummary } from "@/lib/types"

export const metadata: Metadata = {
    title: "Sessions",
}

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" })

export default function SessionsPage() {
    return (
        <>
            <h1 className="mb-4 text-xl font-semibold">Sessions</h1>
            <Suspense fallback={<SessionListSkeleton />}>
                <SessionList />
            </Suspense>
        </>
    )
}

async function SessionList() {
    const sessions = await api<SessionSummary[]>("/sessions")

    if (sessions.length === 0) {
        return <p className="text-muted-foreground">No sessions yet.</p>
    }

    return (
        <ul className="flex flex-col gap-2">
            {sessions.map((session) => {
                const count = session._count.workoutExercises

                return (
                    <li key={session.id} className="rounded-lg border p-3">
                        <div className="flex items-baseline justify-between">
                            <span className="font-medium">{session.sessionType}</span>
                            <span className="text-sm text-muted-foreground">
                                {dateFormat.format(new Date(session.date))}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {count} {count === 1 ? "exercise" : "exercises"}
                        </p>
                        {session.note && <p className="mt-1 text-sm">{session.note}</p>}
                    </li>
                )
            })}
        </ul>
    )
}

function SessionListSkeleton() {
    return (
        <ul className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
                <li key={i} className="flex flex-col gap-2 rounded-lg border p-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                </li>
            ))}
        </ul>
    )
}
