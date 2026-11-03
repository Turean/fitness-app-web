const weightNumber = new Intl.NumberFormat("en", { maximumFractionDigits: 2 })

const shortDate = new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
})

const longDate = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
})

export function formatWeight(weight: number) {
    return weight === 0 ? "BW" : `${weightNumber.format(weight)} kg`
}

export function formatShortDate(iso: string) {
    return shortDate.format(new Date(iso))
}

export function formatLongDate(iso: string) {
    return longDate.format(new Date(iso))
}
