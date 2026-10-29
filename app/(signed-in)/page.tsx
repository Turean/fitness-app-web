import { Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { SessionSummary } from "@/lib/types"
import { getCurrentUser } from "@/lib/user"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
    title: "Home",
}

const dateFormat = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
})

export default function HomePage() {
    return (
        <>
            <Suspense fallback={<WelcomeSkeleton />}>
                <Welcome />
            </Suspense>

            <Link
                href="/sessions/new"
                className={cn(buttonVariants(), "mt-6 h-14 w-full text-base")}
            >
                <Plus />
                Start a session
            </Link>

            <section className="mt-8">
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                    Recent sessions
                </h2>
                <Suspense fallback={<SessionListSkeleton />}>
                    <SessionList />
                </Suspense>
            </section>
        </>
    )
}

async function Welcome() {
    const user = await getCurrentUser()

    return (
        <div className="pt-4">
            <h1 className="text-2xl font-semibold tracking-tight">
                Welcome, {user.name}
            </h1>
            <p className="mt-1 text-muted-foreground">Ready to train?</p>
        </div>
    )
}

function WelcomeSkeleton() {
    return (
        <div className="flex flex-col gap-2 pt-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
        </div>
    )
}

async function SessionList() {
    const sessions = await api<SessionSummary[]>("/sessions")

    if (sessions.length === 0) {
        return (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No sessions yet. Start your first one above.
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

function SessionListSkeleton() {
    return (
        <ul className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
                <li key={i} className="flex flex-col gap-2 rounded-lg border p-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                </li>
            ))}
        </ul>
    )
}
