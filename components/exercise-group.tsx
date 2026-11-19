import type { ReactNode } from "react"

export function ExerciseGroup({
    muscleGroup,
    count,
    children,
}: {
    muscleGroup: string
    count: number
    children: ReactNode
}) {
    return (
        <section>
            <h2 className="mb-2 flex items-baseline justify-between text-sm font-medium text-muted-foreground">
                {muscleGroup}
                <span className="tabular-nums">{count}</span>
            </h2>
            <ul className="divide-y rounded-lg border">{children}</ul>
        </section>
    )
}
