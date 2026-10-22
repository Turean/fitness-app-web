"use client"

import { useActionState, useId } from "react"

import { register, type RegisterState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterForm() {
    const [state, formAction, pending] = useActionState<RegisterState, FormData>(
        register,
        {},
    )
    const id = useId()

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-name`}>Name</Label>
                <Input
                    key={state.values?.name}
                    id={`${id}-name`}
                    name="name"
                    autoComplete="name"
                    defaultValue={state.values?.name}
                    required
                    className="h-11"
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-username`}>Username</Label>
                <Input
                    key={state.values?.username}
                    id={`${id}-username`}
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    defaultValue={state.values?.username}
                    required
                    className="h-11"
                />
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-email`}>Email</Label>
                <Input
                    key={state.values?.email}
                    id={`${id}-email`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={state.values?.email}
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
                    autoComplete="new-password"
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
                {pending ? "Creating account…" : "Create account"}
            </Button>
        </form>
    )
}
