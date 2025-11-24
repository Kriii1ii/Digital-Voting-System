import React from "react";
import { RefreshCw } from "lucide-react";
import PredictionPoll from "./PredictionPoll.jsx";
import { useElectionPrediction } from "../hooks/useElectionPrediction.js";

const defaultInterval = 15000;

export default function PredictionPollCard({
  electionId,
  title = "Election Prediction Poll",
  refreshInterval = defaultInterval,
}) {
  const { candidates, topCandidateId, loading, error, lastUpdated, canView, refresh } =
    useElectionPrediction({ electionId, refreshInterval });

  if (!canView) return null;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">
            AI-assisted prediction • auto refresh every {Math.round(refreshInterval / 1000)}s
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-slate-400">
              Last updated {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && !candidates.length && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-10 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          Fetching live prediction data…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {error}
        </div>
      )}

      {!loading && !error && !candidates.length && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
          No engagement activity has been recorded yet. Check back once voters start reacting to
          campaign content.
        </div>
      )}

      {!!candidates.length && !error && (
        <PredictionPoll candidates={candidates} topCandidateId={topCandidateId} />
      )}
    </div>
  );
}

