import React from "react";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join("");

const formatPercentage = (value = 0) => `${Number(value || 0).toFixed(1)}%`;

const progressClass = (isLeader) =>
  isLeader
    ? "from-indigo-500 via-blue-500 to-cyan-400"
    : "from-rose-400 via-orange-400 to-amber-300";

const cardBorderClass = (isLeader) =>
  isLeader ? "border-blue-500 bg-blue-50/70 shadow-blue-100" : "border-slate-100 bg-white";

const textMuted = "text-slate-500";

export default function PredictionPoll({ candidates = [], topCandidateId }) {
  if (!candidates.length) {
    return null;
  }

  const sorted = [...candidates].sort((a, b) => b.percentage - a.percentage);
  const leader = sorted.find((candidate) => candidate.id === topCandidateId) || sorted[0];

  return (
    <div className="space-y-4">
      {leader && (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/70">Predicted Winner</p>
              <p className="mt-1 text-2xl font-semibold">{leader.name}</p>
              <p className="text-white/80">{leader.party}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur-sm">
              {formatPercentage(leader.percentage)}
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-white/15 p-3 text-sm text-white/80">
            Based on live engagement metrics gathered across votes, reactions, and comments.
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {sorted.map((candidate, index) => {
          const percentage = Math.max(0, Math.min(candidate.percentage ?? 0, 100));
          const isLeader = candidate.id === topCandidateId || (index === 0 && !topCandidateId);

          return (
            <li
              key={candidate.id || candidate.name || index}
              className={`rounded-2xl border p-4 shadow-sm ${cardBorderClass(isLeader)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-semibold text-slate-600">
                    {getInitials(candidate.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{candidate.name}</p>
                    <p className={`text-xs ${textMuted}`}>{candidate.party}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900">{formatPercentage(percentage)}</p>
                  {isLeader && <p className="text-xs font-medium text-blue-600">Leading</p>}
                </div>
              </div>

              <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${progressClass(isLeader)} transition-[width] duration-700`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}





