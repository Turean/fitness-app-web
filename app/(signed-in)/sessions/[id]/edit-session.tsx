"use client"

import { Pencil } from "lucide-react"
import { useActionState, useId, useState } from "react"

import {
    deleteSession,
    type EditSessionState,
    updateSession,
} from "@/app/actions/sessions"
import { SessionTypeChoice } from "@/components/session-type-choice"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSubmitGuard } from "@/lib/use-submit-guard"

type SessionInfo = {
    id: number
    sessionType: string
    note: string | null
    exerciseCount: number
    setCount: number
}

export function EditSessionButton({ session }: { session: SessionInfo }) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(true)}
                className="h-11 shrink-0 px-4"
            >
                <Pencil />
                Edit
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <EditSession session={session} onDone={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    )
}

type FormState = EditSessionState & { attempt?: number }

function EditSession({ session, onDone }: { session: SessionInfo; onDone: () => void }) {
    const id = useId()
    const [confirming, setConfirming] = useState(false)

    const [editState, editAction, editPending] = useActionState<FormState, FormData>(
        async (prev, formData) => {
            const result = await updateSession(session.id, prev, formData)
            if (result.done) {
                onDone()
            }
            return { ...result, attempt: (prev.attempt ?? 0) + 1 }
        },
        {},
    )
    // Success redirects, so only an error comes back.
    const [deleteState, deleteAction, deletePending] = useActionState(
        () => deleteSession(session.id),
        {},
    )
    const editGuard = useSubmitGuard(editPending)
    const deleteGuard = useSubmitGuard(deletePending)

    if (confirming) {
        return (
            <form action={deleteAction} onSubmit={deleteGuard} className="flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle>Delete this {session.sessionType} session?</DialogTitle>
                    <DialogDescription>
                        {describeContents(session.exerciseCount, session.setCount)} This
                        can’t be undone.
                    </DialogDescription>
                </DialogHeader>

                {deleteState.error && (
                    <p role="alert" className="text-sm text-destructive">
                        {deleteState.error}
                    </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setConfirming(false)}
                        className="h-12 text-base"
                    >
                        Keep it
                    </Button>
                    <Button
                        type="submit"
                        variant="destructive"
                        disabled={deletePending}
                        className="h-12 text-base"
                    >
                        {deletePending ? "Deleting…" : "Delete"}
                    </Button>
                </div>
            </form>
        )
    }

    const defaults = editState.values ?? {
        sessionType: session.sessionType,
        note: session.note ?? "",
    }

    return (
        <form action={editAction} onSubmit={editGuard} className="flex flex-col gap-5">
            <DialogHeader>
                <DialogTitle>Edit session</DialogTitle>
                <DialogDescription>Change the type or the note.</DialogDescription>
            </DialogHeader>

            <div key={editState.attempt ?? 0} className="flex flex-col gap-5">
                <SessionTypeChoice legend="Type" defaultValue={defaults.sessionType} />
                <div className="flex flex-col gap-2">
                    <Label htmlFor={`${id}-note`}>Note</Label>
                    <Textarea
                        id={`${id}-note`}
                        name="note"
                        defaultValue={defaults.note}
                        placeholder="How did it go?"
                        className="min-h-24 text-base md:text-base"
                    />
                </div>
            </div>

            {editState.error && (
                <p role="alert" className="text-sm text-destructive">
                    {editState.error}
                </p>
            )}

            <Button type="submit" disabled={editPending} className="h-12 w-full text-base">
                {editPending ? "Saving…" : "Save"}
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirming(true)}
                className="-mt-3 h-12 w-full text-base text-destructive hover:text-destructive"
            >
                Delete session
            </Button>
        </form>
    )
}

function describeContents(exercises: number, sets: number) {
    if (exercises === 0) {
        return "It has no exercises."
    }
    const e = `${exercises} ${exercises === 1 ? "exercise" : "exercises"}`
    const s = `${sets} ${sets === 1 ? "set" : "sets"}`
    return `Its ${e} and ${s} go with it.`
}
