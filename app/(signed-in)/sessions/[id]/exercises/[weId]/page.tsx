import { ChevronLeft, Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { SetTable } from "@/components/set-table"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { SessionDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

import { AddSetForm } from "./add-set-form"

export const metadata: Metadata = {
    title: "Log sets",
}

type Props = PageProps<"/sessions/[id]/exercises/[weId]">

export default function LogSetsPage({ params }: Props) {
    return (
        <Suspense fallback={<LogSetsSkeleton />}>
            <LogSets params={params} />
        </Suspense>
    )
}

async function LogSets({ params }: Pick<Props, "params">) {
    const { id, weId } = await params

    // Both ids go into API paths, and fetch resolves "..".
    if (!/^\d+$/.test(id) || !/^\d+$/.test(weId)) {
        notFound()
    }

    const session = await api<SessionDetail>(`/sessions/${id}`)
    const entry = session.workoutExercises.find((we) => we.id === Number(weId))

    if (!entry) {
        notFound()
    }

    const sets = entry.sets
    const lastSet = sets.at(-1)

    return (
        <>
            <Link
                href={`/sessions/${session.id}`}
                className="-ml-2 inline-flex h-11 items-center gap-0.5 px-2 text-sm text-muted-foreground"
            >
                <ChevronLeft className="size-4" />
                {session.sessionType} session
            </Link>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                {entry.exercise.name}
            </h1>
            <p className="mt-1 mb-6 text-muted-foreground">{entry.exercise.muscleGroup}</p>

            <AddSetForm
                workoutExerciseId={entry.id}
                setCount={sets.length}
                lastSet={lastSet && { reps: lastSet.reps, weight: lastSet.weight }}
            />

            <section className="mt-8">
                {sets.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No sets yet. Log your first one above.
                    </p>
                ) : (
                    <SetTable sets={sets} />
                )}
            </section>

            <Link
                href={`/sessions/${session.id}/exercises/new`}
                className={cn(buttonVariants({ variant: "outline" }), "mt-8 h-14 w-full text-base")}
            >
                <Plus />
                Next exercise
            </Link>
        </>
    )
}

function LogSetsSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/4" />
            <div className="mt-4 grid grid-cols-2 gap-3">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
            </div>
            <Skeleton className="mt-1 h-14 w-full" />
        </div>
    )
}
