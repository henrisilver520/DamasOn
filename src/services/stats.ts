import { db, firebase } from "@/firebase/firebase";
type Result = "win" | "loss" | "draw";

const STATS = "stats";

export interface UserStats {
  uid: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  piecesCaptured: number;
  piecesLost: number;
  currentStreak: number;
  bestStreak: number;
  rating: number;
  createdAt: number;
  updatedAt: number;
}

// Obtém estatísticas do usuário
export async function getUserStats(uid: string): Promise<UserStats | null> {
  const doc = await db.collection(STATS).doc(uid).get();
  if (!doc.exists) return null;
  
  const data = doc.data() as any;
  return {
    uid: doc.id,
    name: data.name || "",
    wins: data.wins || 0,
    losses: data.losses || 0,
    draws: data.draws || 0,
    totalGames: data.totalGames || 0,
    piecesCaptured: data.piecesCaptured || 0,
    piecesLost: data.piecesLost || 0,
    currentStreak: data.currentStreak || 0,
    bestStreak: data.bestStreak || 0,
    rating: data.rating || 1000,
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
    updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
  };
}
export async function updateMatchResult(
  uid: string,
  name: string,
  result: Result,
  piecesCaptured: number,
  piecesLost: number,
  gameId: string // ✅ NOVO
) {
  const statsRef = db.collection(STATS).doc(uid);
  const matchRef = statsRef.collection("matches").doc(gameId);

  await db.runTransaction(async (tx) => {
    // ✅ trava duplicata
    const matchSnap = await tx.get(matchRef);
    if (matchSnap.exists) return;

    const statsSnap = await tx.get(statsRef);
    const s = (statsSnap.exists ? statsSnap.data() : {}) as any;

    const wins = Number(s.wins || 0);
    const losses = Number(s.losses || 0);
    const draws = Number(s.draws || 0);
    const totalGames = Number(s.totalGames || 0);

    const rating = Number(s.rating || 1000);

    const currentStreak = Number(s.currentStreak || 0);
    const bestStreak = Number(s.bestStreak || 0);

    const capturedTotal = Number(s.piecesCaptured || 0);
    const lostTotal = Number(s.piecesLost || 0);

    // ========= rating simples (ajuste se quiser Elo real)
    const ratingDelta = result === "win" ? 10 : result === "loss" ? -10 : 0;
    const nextRating = Math.max(0, rating + ratingDelta);

    // ========= streak
    // win => +1
    // loss => zera
    // draw => mantém (ou zera, se você preferir)
    let nextCurrentStreak = currentStreak;
    if (result === "win") nextCurrentStreak = currentStreak + 1;
    else if (result === "loss") nextCurrentStreak = 0;
    // draw: mantém

    const nextBestStreak = Math.max(bestStreak, nextCurrentStreak);

    const next = {
      uid,
      name: name ?? s.name ?? "",
      wins: wins + (result === "win" ? 1 : 0),
      losses: losses + (result === "loss" ? 1 : 0),
      draws: draws + (result === "draw" ? 1 : 0),
      totalGames: totalGames + 1,

      piecesCaptured: capturedTotal + (piecesCaptured || 0),
      piecesLost: lostTotal + (piecesLost || 0),

      rating: nextRating,
      currentStreak: nextCurrentStreak,
      bestStreak: nextBestStreak,

      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: s.createdAt ?? firebase.firestore.FieldValue.serverTimestamp(),
    };

    tx.set(statsRef, next, { merge: true });

    // ✅ marca a partida como já contabilizada
    tx.set(matchRef, {
      gameId,
      result,
      piecesCaptured: piecesCaptured || 0,
      piecesLost: piecesLost || 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  });
}

// Listener para estatísticas em tempo real
export function listenUserStats(uid: string, onChange: (stats: UserStats | null) => void) {
  return db.collection(STATS).doc(uid).onSnapshot((snap) => {
    if (!snap.exists) {
      onChange(null);
      return;
    }
    
    const data = snap.data() as any;
    onChange({
      uid: snap.id,
      name: data.name || "",
      wins: data.wins || 0,
      losses: data.losses || 0,
      draws: data.draws || 0,
      totalGames: data.totalGames || 0,
      piecesCaptured: data.piecesCaptured || 0,
      piecesLost: data.piecesLost || 0,
      currentStreak: data.currentStreak || 0,
      bestStreak: data.bestStreak || 0,
      rating: data.rating || 1000,
      createdAt: data.createdAt?.toMillis?.() || Date.now(),
      updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
    });
  });
}

// Obtém ranking dos melhores jogadores
export async function getLeaderboard(limitCount: number = 10): Promise<UserStats[]> {
  const snap = await db
    .collection(STATS)
    .orderBy("rating", "desc")
    .limit(limitCount)
    .get();
  
  const stats: UserStats[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as any;
    stats.push({
      uid: doc.id,
      name: data.name || "",
      wins: data.wins || 0,
      losses: data.losses || 0,
      draws: data.draws || 0,
      totalGames: data.totalGames || 0,
      piecesCaptured: data.piecesCaptured || 0,
      piecesLost: data.piecesLost || 0,
      currentStreak: data.currentStreak || 0,
      bestStreak: data.bestStreak || 0,
      rating: data.rating || 1000,
      createdAt: data.createdAt?.toMillis?.() || Date.now(),
      updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
    });
  });
  
  return stats;
}
