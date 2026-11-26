import { SESSION_TYPES } from "@/lib/session-types"

// Three large radios. Uncontrolled, so a form re-mounted with a `key`
// after an error shows the type that was sent.
export function SessionTypeChoice({
    legend,
    defaultValue,
}: {
    legend: string
    defaultValue?: string
}) {
    return (
        <fieldset>
            <legend className="mb-3 text-sm font-medium">{legend}</legend>
            <div className="grid grid-cols-3 gap-2">
                {SESSION_TYPES.map((type) => (
                    <label key={type} className="relative">
                        <input
                            type="radio"
                            name="sessionType"
                            value={type}
                            required
                            defaultChecked={defaultValue === type}
                            className="peer sr-only"
                        />
                        <span className="flex h-16 cursor-pointer items-center justify-center rounded-lg border text-base font-semibold transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                            {type}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    )
}
