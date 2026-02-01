import { db, firebase } from "@/firebase/firebase";
import type { TableDoc, TableKind } from "@/types/domain";

const TABLES = "Tables";

function mapTable(id: string, data: any): TableDoc {
  const stakeValue = data.stake ?? data.betAmount ?? undefined;
  return {
    id,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
    createdByUid: String(data.createdByUid ?? ""),
    createdByName: String(data.createdByName ?? ""),
    createdByCity: data.createdByCity ?? undefined,
    createdByAge: data.createdByAge ?? undefined,
    kind: (data.kind as TableKind) ?? "free",
    stake: stakeValue !== null && stakeValue !== undefined ? Number(stakeValue) : undefined,
    status: (data.status as any) ?? "waiting",
    opponentUid: data.opponentUid ?? undefined,
    opponentName: data.opponentName ?? undefined,
  };
}

export async function createTable(params: {
  createdByUid: string;
  createdByName: string;
  createdByCity?: string;
  createdByAge?: number;
  kind: TableKind;
  stake?: number;
}): Promise<TableDoc> {
  const ref = db.collection(TABLES).doc();
  const now = Date.now();
  const stake = params.kind === "bet" ? Number(params.stake ?? 0) : null;
  const tableData = {
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdByUid: params.createdByUid,
    createdByName: params.createdByName,
    createdByCity: params.createdByCity || null,
    createdByAge: params.createdByAge || null,
    kind: params.kind,
    stake,
    status: "waiting",
    opponentUid: null,
    opponentName: null,
  };
  await ref.set(tableData);
  
  // Retorna o objeto TableDoc completo
  return {
    id: ref.id,
    createdAt: now,
    createdByUid: params.createdByUid,
    createdByName: params.createdByName,
    createdByCity: params.createdByCity,
    createdByAge: params.createdByAge,
    kind: params.kind,
    stake: params.kind === "bet" ? Number(params.stake ?? 0) : undefined,
    status: "waiting",
    opponentUid: undefined,
    opponentName: undefined,
  };
}

export async function cancelTable(tableId: string, uid: string) {
  const ref = db.collection(TABLES).doc(tableId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data() as any;
    if (data.createdByUid !== uid) throw new Error("Apenas o criador pode cancelar");
    if (data.status !== "waiting") throw new Error("Mesa não pode mais ser cancelada");
    tx.update(ref, { status: "canceled" });
  });
}

export async function joinTable(tableId: string, uid: string, name: string) {
  const ref = db.collection(TABLES).doc(tableId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Mesa não existe");
    const data = snap.data() as any;
    if (data.status !== "waiting") throw new Error("Mesa indisponível");
    if (data.createdByUid === uid) throw new Error("Você já é o criador");
    tx.update(ref, {
      status: "playing",
      opponentUid: uid,
      opponentName: name,
    });
  });
}

export async function leaveTable(tableId: string, uid: string) {
  const ref = db.collection(TABLES).doc(tableId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data() as any;
    // Se for o criador, cancela a mesa
    if (data.createdByUid === uid) {
      if (data.status !== "waiting") throw new Error("Mesa não pode mais ser cancelada");
      tx.update(ref, { status: "canceled" });
      return;
    }
    // Se for oponente e ainda está waiting, remove o oponente
    if (data.opponentUid === uid && data.status === "waiting") {
      tx.update(ref, {
        opponentUid: null,
        opponentName: null,
      });
      return;
    }
    // Se for oponente e está playing, marca como finished
    if (data.opponentUid === uid && data.status === "playing") {
      tx.update(ref, { status: "finished" });
      return;
    }
  });
}

export function listenTables(onChange: (tables: TableDoc[]) => void) {
  return db
    .collection(TABLES)
    .where("status", "in", ["waiting", "playing"]) // lobby
    .onSnapshot((snap) => {
      const tables: TableDoc[] = [];
      snap.forEach((d) => tables.push(mapTable(d.id, d.data())));
      tables.sort((a, b) => b.createdAt - a.createdAt);
      onChange(tables);
    });
}
