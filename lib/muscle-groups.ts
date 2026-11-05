export const MUSCLE_GROUPS = [
    "Chest",
    "Back",
    "Shoulders",
    "Arms",
    "Legs",
    "Core",
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export function isMuscleGroup(value: unknown): value is MuscleGroup {
    return MUSCLE_GROUPS.includes(value as MuscleGroup)
}
