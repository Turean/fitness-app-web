export type User = {
    id: number
    name: string
    email: string
    username: string
    createdAt: string
}

export type AuthResponse = {
    safeUser: User
    token: string
}

export type Exercise = {
    id: number
    name: string
    muscleGroup: string
    userId: number
}

export type Session = {
    id: number
    sessionType: string
    note: string | null
    date: string
    userId: number
}

export type SessionSummary = Session & {
    _count: { workoutExercises: number }
}

export type WorkoutExercise = {
    id: number
    sessionId: number
    exerciseId: number
}

export type SessionDetail = Session & {
    workoutExercises: (WorkoutExercise & { exercise: Exercise })[]
}

export type WorkoutSet = {
    id: number
    setNumber: number
    reps: number
    weight: number
    workoutExerciseId: number
}
