import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { SessionSummary } from "@/lib/types"

const dateFormat = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
})

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
                    <li key={session.id} className="rounded-lg border p-4">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold">{session.sessionType}</span>
                            <span className="text-sm text-muted-foreground">
                                {dateFormat.format(new Date(session.date))}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {count} {count === 1 ? "exercise" : "exercises"}
                        </p>
                        {session.note && <p className="mt-2 text-sm">{session.note}</p>}
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
