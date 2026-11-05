import { formatWeight } from "@/lib/format"
import type { WorkoutSet } from "@/lib/types"

export function SetTable({ sets }: { sets: WorkoutSet[] }) {
    return (
        <table className="w-full text-sm tabular-nums">
            <thead className="text-left text-xs text-muted-foreground">
                <tr>
                    <th className="w-12 pb-1 font-medium">Set</th>
                    <th className="pb-1 font-medium">Reps</th>
                    <th className="pb-1 text-right font-medium">Weight</th>
                </tr>
            </thead>
            <tbody>
                {sets.map((set) => (
                    <tr key={set.id} className="border-t">
                        <td className="py-2 text-muted-foreground">{set.setNumber}</td>
                        <td className="py-2">{set.reps}</td>
                        <td className="py-2 text-right font-medium">
                            {formatWeight(set.weight)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
