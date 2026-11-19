import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { ExerciseGroup } from "@/components/exercise-group"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { groupExercises } from "@/lib/exercise-groups"
import type { Exercise, SessionDetail } from "@/lib/types"

import { AddToSessionList } from "./add-to-session-list"
import { NewExerciseForm } from "./new-exercise-form"

export const metadata: Metadata = {
    title: "Exercise library",
}

type Props = PageProps<"/exercises">

export default function ExercisesPage({ searchParams }: Props) {
    return (
        <Suspense fallback={<LibrarySkeleton />}>
            <Library searchParams={searchParams} />
        </Suspense>
    )
}

// ?session=ID opens the library for adding an exercise to that session.
async function Library({ searchParams }: Pick<Props, "searchParams">) {
    const { session: sessionParam } = await searchParams

    // The id goes into an API path, and fetch resolves "..".
    const sessionId =
        typeof sessionParam === "string" && /^\d+$/.test(sessionParam) ? sessionParam : null

    const [exercises, session] = await Promise.all([
        api<Exercise[]>("/exercises"),
        sessionId === null ? null : api<SessionDetail>(`/sessions/${sessionId}`),
    ])
    const groups = groupExercises(exercises)

    return (
        <>
            <Link
                href={session ? `/sessions/${session.id}` : "/"}
                className="-ml-2 inline-flex h-11 items-center gap-0.5 px-2 text-sm text-muted-foreground"
            >
                <ChevronLeft className="size-4" />
                {session ? `${session.sessionType} session` : "Home"}
            </Link>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Exercise library</h1>
            <p className="mt-1 mb-6 text-muted-foreground">
                {session
                    ? `Tap an exercise to add it to your ${session.sessionType} session.`
                    : exercises.length === 0
                      ? "No exercises yet."
                      : `${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"} · ${groups.length} ${groups.length === 1 ? "muscle group" : "muscle groups"}`}
            </p>

            <NewExerciseForm
                key={session?.id ?? "library"}
                sessionId={session?.id ?? null}
                startOpen={exercises.length === 0}
            />

            {groups.length > 0 && (
                <div className="mt-8 flex flex-col gap-6">
                    {session ? (
                        <AddToSessionList
                            sessionId={session.id}
                            groups={groups}
                            inSession={Object.fromEntries(
                                session.workoutExercises.map((we) => [we.exerciseId, we.id]),
                            )}
                        />
                    ) : (
                        groups.map((group) => (
                            <ExerciseGroup
                                key={group.muscleGroup}
                                muscleGroup={group.muscleGroup}
                                count={group.exercises.length}
                            >
                                {group.exercises.map((exercise) => (
                                    <li key={exercise.id} className="px-4 py-3 font-medium">
                                        {exercise.name}
                                    </li>
                                ))}
                            </ExerciseGroup>
                        ))
                    )}
                </div>
            )}
        </>
    )
}

function LibrarySkeleton() {
    return (
        <div className="flex flex-col gap-2">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="mt-4 h-14 w-full" />
            {[0, 1].map((i) => (
                <div key={i} className="mt-6 flex flex-col gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ))}
        </div>
    )
}
