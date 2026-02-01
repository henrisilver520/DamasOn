export type MatchOutcome =
  | { type: "WIN"; winnerUid: string }
  | { type: "DRAW" }
  | { type: "CANCEL" }

export interface UserBalance {
  balance: number
  locked: number
}

export interface Match {
  stake: number
  status: "playing" | "settled"
  players: { a: string; b: string }
}
