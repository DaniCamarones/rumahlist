"use client";

import { describeActivity, useActivity } from "@/hooks/use-activity";
import { timeAgo } from "@/lib/format";
import { useHousehold } from "./household-provider";

/** Family activity printed as a running log, one line per event. */
export function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const { household, memberName } = useHousehold();
  const activity = useActivity(household.id, limit);

  if (activity === null)
    return <div className="paper mt-2 h-32 animate-pulse" aria-busy="true" aria-label="Memuat aktivitas" />;
  if (activity.length === 0)
    return (
      <p className="paper mt-2 px-4 py-4 text-[14px] text-muted">
        Belum ada catatan. Setiap barang yang ditambah, dibeli, atau dihapus akan tercatat di sini.
      </p>
    );

  return (
    <ul className="paper mt-2 px-4 py-2 font-mono text-[14px]">
      {activity.map((a) => {
        const { verb, object } = describeActivity(a);
        return (
          <li key={a.id} className="border-b border-dashed border-ink/20 py-2 last:border-b-0">
            <span className="font-semibold">{memberName(a.actor_id)}</span> {verb} {object && <span className="font-semibold">{object}</span>}
            <span className="block text-[12px] text-muted">{timeAgo(a.created_at)}</span>
          </li>
        );
      })}
    </ul>
  );
}
