"use client"

import { useActionState, useId } from "react"

import { login, type LoginState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
    const [state, formAction, pending] = useActionState<LoginState, FormData>(
        login,
        {},
    )
    const id = useId()

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-username`}>Username</Label>
                <Input
                    key={state.username}
                    id={`${id}-username`}
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    defaultValue={state.username}
                    required
                    className="h-11"
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-password`}>Password</Label>
                <Input
                    id={`${id}-password`}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="h-11"
                />
            </div>

            {state.error && (
                <p role="alert" className="text-sm text-destructive">
                    {state.error}
                </p>
            )}

            <Button type="submit" disabled={pending} className="h-11 w-full">
                {pending ? "Signing in…" : "Sign in"}
            </Button>
        </form>
    )
}
