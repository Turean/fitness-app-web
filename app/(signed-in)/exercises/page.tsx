import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { groupExercises } from "@/lib/exercise-groups"
import type { Exercise } from "@/lib/types"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
    title: "Exercise library",
}

export default function ExercisesPage() {
    return (
        <>
            <Link
                href="/"
                className="-ml-2 inline-flex h-11 items-center gap-0.5 px-2 text-sm text-muted-foreground"
            >
                <ChevronLeft className="size-4" />
                Home
            </Link>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Exercise library</h1>

            <Suspense fallback={<LibrarySkeleton />}>
                <Library />
            </Suspense>
        </>
    )
}

async function Library() {
    const exercises = await api<Exercise[]>("/exercises")

    if (exercises.length === 0) {
        return (
            <div className="mt-6 flex flex-col gap-4 rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    No exercises yet. You create them when you start a session or add an
                    exercise to one.
                </p>
                <Link
                    href="/sessions/new"
                    className={cn(buttonVariants(), "h-11 w-full")}
                >
                    Start a session
                </Link>
            </div>
        )
    }

    const groups = groupExercises(exercises)

    return (
        <>
            <p className="mt-1 mb-6 text-muted-foreground">
                {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
                {" · "}
                {groups.length} {groups.length === 1 ? "muscle group" : "muscle groups"}
            </p>

            <div className="flex flex-col gap-6">
                {groups.map((group) => (
                    <section key={group.muscleGroup}>
                        <h2 className="mb-2 flex items-baseline justify-between text-sm font-medium text-muted-foreground">
                            {group.muscleGroup}
                            <span className="tabular-nums">{group.exercises.length}</span>
                        </h2>
                        <ul className="divide-y rounded-lg border">
                            {group.exercises.map((exercise) => (
                                <li key={exercise.id} className="px-4 py-3 font-medium">
                                    {exercise.name}
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </>
    )
}

function LibrarySkeleton() {
    return (
        <div className="flex flex-col gap-6 pt-2">
            <Skeleton className="h-5 w-40" />
            {[0, 1].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ))}
        </div>
    )
}
