export function readNumber(form: FormData, field: string): number | undefined {
    const raw = form.get(field)

    // Number("") is 0, which for a weight would silently mean bodyweight.
    if (typeof raw !== "string" || raw.trim() === "") {
        return undefined
    }
    return Number(raw)
}

export function readString(form: FormData, field: string): string {
    const raw = form.get(field)
    return typeof raw === "string" ? raw : ""
}
