import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { groupExercises } from "@/lib/exercise-groups"
import type { Exercise } from "@/lib/types"

import { NewSessionForm } from "./new-session-form"

export const metadata: Metadata = {
    title: "Start a session",
}

export default function NewSessionPage() {
    return (
        <>
            <Link
                href="/"
                className="-ml-2 inline-flex h-11 items-center gap-0.5 px-2 text-sm text-muted-foreground"
            >
                <ChevronLeft className="size-4" />
                Home
            </Link>

            <h1 className="mt-1 mb-6 text-2xl font-semibold tracking-tight">
                Start a session
            </h1>

            <Suspense fallback={<FormSkeleton />}>
                <FormWithExercises />
            </Suspense>
        </>
    )
}

async function FormWithExercises() {
    const exercises = await api<Exercise[]>("/exercises")
    return <NewSessionForm groups={groupExercises(exercises)} />
}

function FormSkeleton() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-40" />
                <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-16" />
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-11 w-full" />
            </div>
            <Skeleton className="h-14 w-full" />
        </div>
    )
}
