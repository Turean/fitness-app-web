import { Suspense } from "react"

import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import type { User } from "@/lib/types"

export default function SignedInLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-dvh">
            <header className="flex items-center justify-between border-b px-4 py-2">
                <Suspense fallback={<Skeleton className="h-5 w-24" />}>
                    <UserName />
                </Suspense>
                <form action={logout}>
                    <Button type="submit" variant="ghost" className="h-11">
                        Log out
                    </Button>
                </form>
            </header>
            <main className="mx-auto max-w-lg p-4">{children}</main>
        </div>
    )
}

async function UserName() {
    const user = await api<User>("/verify")
    return <span className="font-medium">{user.name}</span>
}
