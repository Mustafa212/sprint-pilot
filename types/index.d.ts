// What the sprint board keeps in the session's state: one row per unit still in play.
export type SprintPilotUnit = {
  /** The run file's name without `.md`, `<project>-<sprint>`. */
  run: string
  unit: string
  story: string
  /** The run file's status: planned, queued, stacked, held, launched or done. */
  status: string
  /** senior-dev's `Phase`, or — when the unit has no state yet. */
  phase: string
  next: string
  /** What the unit waits for the user to answer, or empty. */
  waiting: string
  pr: string
  /** A background session's id and state, as `claude agents --json` gives them, or empty. */
  session: string
}

declare module 'claude-code' {
  interface PluginState {
    'sprint-pilot': { units: SprintPilotUnit[]; refreshedAt: string }
  }
}
