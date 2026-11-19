import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

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

            <NewSessionForm />
        </>
    )
}
