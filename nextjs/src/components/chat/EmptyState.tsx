"use client";

import { Music, Sparkles, Headphones } from "lucide-react";

/**
 * EmptyState - Music Recommendation Assistant welcome screen
 * Displays when no messages exist in the current session
 */
export function EmptyState(): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center min-h-[60vh]">
      <div className="max-w-4xl w-full space-y-8">
        {/* Main header */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-pink-500" />
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Headphones className="w-6 h-6 text-green-500" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white">
            Music Recommendation Assistant
          </h1>
          <p className="text-xl text-neutral-300">Powered by Google Gemini</p>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Got a mood, a genre, or an artist in mind?
            <br />
            Tell me, and I’ll send you 5 great songs in seconds—just hit{" "}
            <span className="text-white font-semibold">Listen</span> and enjoy.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mx-auto">
              <Music className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="font-semibold text-pink-400">Mood → Music</h3>
            <p className="text-sm text-neutral-400">
              Drop a feeling and get songs that match the vibe.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-semibold text-blue-400">Smart Picks</h3>
            <p className="text-sm text-neutral-400">
              Cleaned input, typo-friendly, and focused recommendations.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto">
              <Headphones className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-semibold text-green-400">One-Click Listen</h3>
            <p className="text-sm text-neutral-400">
              5 songs in a neat table—each with a ready-to-play link.
            </p>
          </div>
        </div>

        {/* Try asking about section */}
        <div className="space-y-4">
          <p className="text-neutral-400">Try asking:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm">
              “chill”
            </span>
            <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm">
              “workout”
            </span>
            <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm">
              “Adele”
            </span>
            <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm">
              “afrobeat”
            </span>
            <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm">
              “sad but hopeful”
            </span>
            <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm">
              “late-night drive”
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
