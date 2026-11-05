"use client"

import { type FormEvent, useEffect, useRef } from "react"

// `disabled={pending}` only applies after a re-render, so a quick second
// tap would otherwise submit twice. Pass the returned handler to onSubmit.
export function useSubmitGuard(pending: boolean) {
    const submitting = useRef(false)

    useEffect(() => {
        if (!pending) {
            submitting.current = false
        }
    }, [pending])

    return (event: FormEvent<HTMLFormElement>) => {
        if (submitting.current) {
            event.preventDefault()
            return
        }
        submitting.current = true
    }
}
