export const SESSION_TYPES = ["PUSH", "PULL", "LEGS"] as const

export type SessionType = (typeof SESSION_TYPES)[number]

export function isSessionType(value: unknown): value is SessionType {
    return SESSION_TYPES.includes(value as SessionType)
}
