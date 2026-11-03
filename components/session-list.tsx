import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { formatShortDate } from "@/lib/format"
import type { SessionSummary } from "@/lib/types"

export async function SessionList({
    limit,
    emptyMessage,
}: {
    limit?: number
    emptyMessage: string
}) {
    const path = limit === undefined ? "/sessions" : `/sessions?limit=${limit}`
    const sessions = await api<SessionSummary[]>(path)

    if (sessions.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
            </p>
        )
    }

    return (
        <ul className="flex flex-col gap-2">
            {sessions.map((session) => {
                const count = session._count.workoutExercises

                return (
                    <li key={session.id}>
                        <Link
                            href={`/sessions/${session.id}`}
                            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 active:bg-muted"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="font-semibold">{session.sessionType}</span>
                                    <span className="text-sm text-muted-foreground">
                                        {formatShortDate(session.date)}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {count} {count === 1 ? "exercise" : "exercises"}
                                </p>
                                {session.note && (
                                    <p className="mt-2 truncate text-sm">{session.note}</p>
                                )}
                            </div>
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}

export function SessionListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <ul className="flex flex-col gap-2">
            {Array.from({ length: count }, (_, i) => (
                <li key={i} className="flex flex-col gap-2 rounded-lg border p-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                </li>
            ))}
        </ul>
    )
}
