import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { groupExercises } from "@/lib/exercise-groups"
import type { Exercise, SessionDetail } from "@/lib/types"

import { AddExerciseForm } from "./add-exercise-form"

export const metadata: Metadata = {
    title: "Add an exercise",
}

type Props = PageProps<"/sessions/[id]/exercises/new">

export default function AddExercisePage({ params }: Props) {
    return (
        <Suspense fallback={<AddExerciseSkeleton />}>
            <AddExercise params={params} />
        </Suspense>
    )
}

async function AddExercise({ params }: Pick<Props, "params">) {
    const { id } = await params

    // The id goes into an API path, and fetch resolves "..".
    if (!/^\d+$/.test(id)) {
        notFound()
    }

    const [session, exercises] = await Promise.all([
        api<SessionDetail>(`/sessions/${id}`),
        api<Exercise[]>("/exercises"),
    ])
    const done = session.workoutExercises.map((we) => we.exercise.name)

    return (
        <>
            <Link
                href={`/sessions/${session.id}`}
                className="-ml-2 inline-flex h-11 items-center gap-0.5 px-2 text-sm text-muted-foreground"
            >
                <ChevronLeft className="size-4" />
                {session.sessionType} session
            </Link>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Add an exercise</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
                {done.length === 0 ? "Nothing logged yet." : `So far: ${done.join(", ")}`}
            </p>

            <AddExerciseForm sessionId={session.id} groups={groupExercises(exercises)} />
        </>
    )
}

function AddExerciseSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-6 h-11 w-full" />
            <Skeleton className="mt-4 h-14 w-full" />
        </div>
    )
}
