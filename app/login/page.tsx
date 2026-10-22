import type { Metadata } from "next"
import Link from "next/link"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { LoginForm } from "./login-form"

export const metadata: Metadata = {
    title: "Sign in",
}

export default function LoginPage() {
    return (
        <main className="flex min-h-dvh items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-xl">REzurge</CardTitle>
                    <CardDescription>Sign in to log your workout.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
                <CardFooter className="justify-center text-sm text-muted-foreground">
                    New here?&nbsp;
                    <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
                        Create an account
                    </Link>
                </CardFooter>
            </Card>
        </main>
    )
}
