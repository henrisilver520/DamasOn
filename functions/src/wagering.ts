import * as admin from "firebase-admin"
import { HttpsError } from "firebase-functions/v2/https"
import { MatchOutcome } from "./types"

const db = admin.firestore()

export async function joinTableWithWager(uid: string, tableId: string) {
  const tableRef = db.collection("Tables").doc(tableId)
  const userRef = db.collection("UsersDamas").doc(uid)

  return db.runTransaction(async tx => {
    const [tableSnap, userSnap] = await Promise.all([
      tx.get(tableRef),
      tx.get(userRef)
    ])

    if (!tableSnap.exists) {
      throw new HttpsError("not-found", "Mesa não encontrada")
    }

    const table = tableSnap.data()!
    const stake = Number(table.stake)

    const user = userSnap.data() || {}
    const balance = Number(user.balance || 0)
    const locked = Number(user.locked || 0)

    if (balance < stake) {
      return {
        ok: false,
        reason: "INSUFFICIENT_BALANCE",
        stake,
        balance
      }
    }

    tx.set(userRef, {
      balance: balance - stake,
      locked: locked + stake
    }, { merge: true })

    return { ok: true }
  })
}

export async function settleMatch(
  matchId: string,
  outcome: MatchOutcome
) {
  const matchRef = db.collection("Matches").doc(matchId)

  return db.runTransaction(async tx => {
    const matchSnap = await tx.get(matchRef)
    if (!matchSnap.exists) {
      throw new HttpsError("not-found", "Match não encontrado")
    }

    const match = matchSnap.data()!
    if (match.status === "settled") return

    const stake = match.stake
    const { a, b } = match.players

    const aRef = db.collection("UsersDamas").doc(a)
    const bRef = db.collection("UsersDamas").doc(b)

    const [aSnap, bSnap] = await Promise.all([
      tx.get(aRef),
      tx.get(bRef)
    ])

    const aData = aSnap.data() || {}
    const bData = bSnap.data() || {}

    tx.set(aRef, { locked: (aData.locked || 0) - stake }, { merge: true })
    tx.set(bRef, { locked: (bData.locked || 0) - stake }, { merge: true })

    if (outcome.type === "WIN") {
      const winnerRef = db.collection("UsersDamas").doc(outcome.winnerUid)
      const winSnap = await tx.get(winnerRef)
      const winData = winSnap.data() || {}

      tx.set(winnerRef, {
        balance: (winData.balance || 0) + stake * 2
      }, { merge: true })
    }

    if (outcome.type === "DRAW" || outcome.type === "CANCEL") {
      tx.set(aRef, { balance: (aData.balance || 0) + stake }, { merge: true })
      tx.set(bRef, { balance: (bData.balance || 0) + stake }, { merge: true })
    }

    tx.set(matchRef, {
      status: "settled",
      outcome,
      settledAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
  })
}
