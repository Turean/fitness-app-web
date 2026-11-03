import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { formatLongDate, formatWeight } from "@/lib/format"
import type { SessionDetail } from "@/lib/types"

export const metadata: Metadata = {
    title: "Session",
}

export default function SessionPage({ params }: PageProps<"/sessions/[id]">) {
    return (
        <>
            <Link
                href="/sessions"
                className="-ml-2 inline-flex h-11 items-center gap-0.5 px-2 text-sm text-muted-foreground"
            >
                <ChevronLeft className="size-4" />
                All sessions
            </Link>

            <Suspense fallback={<SessionSkeleton />}>
                <Session params={params} />
            </Suspense>
        </>
    )
}

async function Session({ params }: Pick<PageProps<"/sessions/[id]">, "params">) {
    const { id } = await params

    // The id goes into the API path, and fetch resolves "..", so anything
    // but digits could reach a different endpoint.
    if (!/^\d+$/.test(id)) {
        notFound()
    }

    const session = await api<SessionDetail>(`/sessions/${id}`)
    const exercises = session.workoutExercises
    const setCount = exercises.reduce((sum, we) => sum + we.sets.length, 0)

    return (
        <>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                {session.sessionType}
            </h1>
            <p className="mt-1 text-muted-foreground">{formatLongDate(session.date)}</p>

            {session.note && (
                <p className="mt-4 rounded-lg bg-muted px-4 py-3 text-sm">{session.note}</p>
            )}

            <p className="mt-6 mb-3 text-sm font-medium text-muted-foreground">
                {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
                {" · "}
                {setCount} {setCount === 1 ? "set" : "sets"}
            </p>

            {exercises.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No exercises in this session yet.
                </p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {exercises.map((we) => (
                        <li key={we.id} className="rounded-lg border p-4">
                            <h2 className="font-semibold">{we.exercise.name}</h2>
                            <p className="text-sm text-muted-foreground">
                                {we.exercise.muscleGroup}
                            </p>

                            {we.sets.length === 0 ? (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    No sets logged.
                                </p>
                            ) : (
                                <table className="mt-3 w-full text-sm tabular-nums">
                                    <thead className="text-left text-xs text-muted-foreground">
                                        <tr>
                                            <th className="w-12 pb-1 font-medium">Set</th>
                                            <th className="pb-1 font-medium">Reps</th>
                                            <th className="pb-1 text-right font-medium">Weight</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {we.sets.map((set) => (
                                            <tr key={set.id} className="border-t">
                                                <td className="py-2 text-muted-foreground">
                                                    {set.setNumber}
                                                </td>
                                                <td className="py-2">{set.reps}</td>
                                                <td className="py-2 text-right font-medium">
                                                    {formatWeight(set.weight)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}

function SessionSkeleton() {
    return (
        <div className="flex flex-col gap-2 pt-1">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-5 w-1/2" />
            <div className="mt-6 flex flex-col gap-3">
                {[0, 1].map((i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-lg border p-4">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="mt-2 h-16 w-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}
