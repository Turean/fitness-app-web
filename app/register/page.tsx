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

import { RegisterForm } from "./register-form"

export const metadata: Metadata = {
    title: "Create account",
}

export default function RegisterPage() {
    return (
        <main className="flex min-h-dvh items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-xl">REzurge</CardTitle>
                    <CardDescription>Create an account to start logging.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm />
                </CardContent>
                <CardFooter className="justify-center text-sm text-muted-foreground">
                    Already have an account?&nbsp;
                    <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                        Sign in
                    </Link>
                </CardFooter>
            </Card>
        </main>
    )
}
