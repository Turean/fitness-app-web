import type { Exercise } from "@/lib/types"

export type ExerciseGroups = { muscleGroup: string; exercises: Exercise[] }[]

export function groupExercises(exercises: Exercise[]): ExerciseGroups {
    const byGroup = new Map<string, Exercise[]>()
    for (const exercise of exercises) {
        byGroup.set(exercise.muscleGroup, [...(byGroup.get(exercise.muscleGroup) ?? []), exercise])
    }

    return [...byGroup]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([muscleGroup, list]) => ({
            muscleGroup,
            exercises: list.sort((a, b) => a.name.localeCompare(b.name)),
        }))
}
