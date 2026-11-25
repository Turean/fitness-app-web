"use client"

import { Pencil } from "lucide-react"
import { useActionState, useId, useState } from "react"

import {
    deleteSet,
    type DeleteSetState,
    type EditSetState,
    updateSet,
} from "@/app/actions/sets"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatWeight } from "@/lib/format"
import type { WorkoutSet } from "@/lib/types"
import { useSubmitGuard } from "@/lib/use-submit-guard"

const rowGrid = "grid grid-cols-[3rem_1fr_auto_1.5rem] items-center gap-2"

// Each set is a button that opens one shared dialog. `selected` outlives
// `open` so the dialog keeps its content while it animates closed.
export function EditableSets({
    workoutExerciseId,
    sets,
}: {
    workoutExerciseId: number
    sets: WorkoutSet[]
}) {
    const [selected, setSelected] = useState<WorkoutSet | null>(null)
    const [open, setOpen] = useState(false)

    return (
        <>
            <div className="text-sm tabular-nums">
                <div className={`${rowGrid} pb-1 text-xs font-medium text-muted-foreground`}>
                    <span>Set</span>
                    <span>Reps</span>
                    <span className="text-right">Weight</span>
                    <span className="sr-only">Edit</span>
                </div>
                <ul>
                    {sets.map((set) => (
                        <li key={set.id} className="border-t">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelected(set)
                                    setOpen(true)
                                }}
                                aria-label={`Edit set ${set.setNumber}`}
                                className={`${rowGrid} -mx-2 min-h-11 w-[calc(100%+1rem)] rounded-md px-2 text-left transition-colors hover:bg-muted/50 active:bg-muted`}
                            >
                                <span className="text-muted-foreground">{set.setNumber}</span>
                                <span>{set.reps}</span>
                                <span className="text-right font-medium">
                                    {formatWeight(set.weight)}
                                </span>
                                <Pencil className="size-3.5 justify-self-end text-muted-foreground" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    {selected && (
                        <EditSet
                            key={selected.id}
                            workoutExerciseId={workoutExerciseId}
                            set={selected}
                            onDone={() => setOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

type EditFormState = EditSetState & { attempt?: number }

function EditSet({
    workoutExerciseId,
    set,
    onDone,
}: {
    workoutExerciseId: number
    set: WorkoutSet
    onDone: () => void
}) {
    const [confirming, setConfirming] = useState(false)

    const [editState, editAction, editPending] = useActionState<EditFormState, FormData>(
        async (prev, formData) => {
            const result = await updateSet(workoutExerciseId, set.id, prev, formData)
            if (result.done) {
                onDone()
            }
            return { ...result, attempt: (prev.attempt ?? 0) + 1 }
        },
        {},
    )
    const [deleteState, deleteAction, deletePending] = useActionState<DeleteSetState>(
        async () => {
            const result = await deleteSet(workoutExerciseId, set.id)
            if (result.done) {
                onDone()
            }
            return result
        },
        {},
    )
    const editGuard = useSubmitGuard(editPending)
    const deleteGuard = useSubmitGuard(deletePending)

    if (confirming) {
        return (
            <form action={deleteAction} onSubmit={deleteGuard} className="flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle>Delete set {set.setNumber}?</DialogTitle>
                    <DialogDescription>
                        {set.reps} reps × {formatWeight(set.weight)}. This can’t be undone.
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
        reps: String(set.reps),
        weight: String(set.weight),
    }

    return (
        <form action={editAction} onSubmit={editGuard} className="flex flex-col gap-4">
            <DialogHeader>
                <DialogTitle>Edit set {set.setNumber}</DialogTitle>
                <DialogDescription>Fix the reps or weight you logged.</DialogDescription>
            </DialogHeader>

            <SetFields key={editState.attempt ?? 0} defaults={defaults} />

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
                className="-mt-2 h-12 w-full text-base text-destructive hover:text-destructive"
            >
                Delete set
            </Button>
        </form>
    )
}

function SetFields({ defaults }: { defaults: { reps: string; weight: string } }) {
    const id = useId()

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-reps`}>Reps</Label>
                <Input
                    id={`${id}-reps`}
                    name="reps"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    defaultValue={defaults.reps}
                    required
                    className="h-14 text-center text-xl tabular-nums"
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-weight`}>Weight (kg)</Label>
                <Input
                    id={`${id}-weight`}
                    name="weight"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    defaultValue={defaults.weight}
                    placeholder="0 = BW"
                    required
                    className="h-14 text-center text-xl tabular-nums"
                />
            </div>
        </div>
    )
}
