import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { SessionList, SessionListSkeleton } from "@/components/session-list"

export const metadata: Metadata = {
    title: "Sessions",
}

export default function SessionsPage() {
    return (
        <>
            <Link
                href="/"
                className="-ml-2 inline-flex h-11 items-center gap-0.5 px-2 text-sm text-muted-foreground"
            >
                <ChevronLeft className="size-4" />
                Home
            </Link>

            <h1 className="mt-1 mb-4 text-2xl font-semibold tracking-tight">
                All sessions
            </h1>

            <Suspense fallback={<SessionListSkeleton count={5} />}>
                <SessionList emptyMessage="No sessions yet." />
            </Suspense>
        </>
    )
}
