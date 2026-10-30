import { ChevronRight, Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { SessionList, SessionListSkeleton } from "@/components/session-list"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/user"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
    title: "Home",
}

const RECENT_SESSIONS = 5

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
                <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-sm font-medium text-muted-foreground">
                        Recent sessions
                    </h2>
                    <Link
                        href="/sessions"
                        className="-mr-2 inline-flex h-11 items-center gap-0.5 px-2 text-sm font-medium"
                    >
                        Show all
                        <ChevronRight className="size-4" />
                    </Link>
                </div>
                <Suspense fallback={<SessionListSkeleton />}>
                    <SessionList
                        limit={RECENT_SESSIONS}
                        emptyMessage="No sessions yet. Start your first one above."
                    />
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
