import * as admin from "firebase-admin"

const db = admin.firestore()

export async function creditCoins(
  uid: string,
  amount: number,
  ref: string,
  reason: string
) {
  if (amount <= 0) return

  const userRef = db.collection("UsersDamas").doc(uid)
  const ledgerRef = userRef.collection("Ledger").doc(ref)

  await db.runTransaction(async tx => {
    const ledgerSnap = await tx.get(ledgerRef)
    if (ledgerSnap.exists) return

    const userSnap = await tx.get(userRef)
    const data = userSnap.data() || {}

    tx.set(userRef, {
      balance: (data.balance || 0) + amount
    }, { merge: true })

    tx.set(ledgerRef, {
      type: "CREDIT",
      amount,
      reason,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
  })
}
