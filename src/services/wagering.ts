// src/services/wagering.ts
import { functions } from "@/firebase/firebase";

export type JoinWagerResult =
  | { ok: true }
  | { ok: false; reason: "INSUFFICIENT_BALANCE"; stake: number; balance: number };

export type MatchOutcome =
  | { type: "WIN"; winnerUid: string }
  | { type: "DRAW" }
  | { type: "CANCEL" };

export async function joinTableWithWager(tableId: string): Promise<JoinWagerResult> {
  const callable = functions.httpsCallable("joinTable"); // nome exportado no backend
  const res = await callable({ tableId });
  return res.data as JoinWagerResult;
}

export async function settleGame(matchId: string, outcome: MatchOutcome) {
  const callable = functions.httpsCallable("settleGame");
  const res = await callable({ matchId, outcome });
  return res.data;
}
