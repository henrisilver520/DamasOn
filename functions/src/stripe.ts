import Stripe from "stripe"
import * as admin from "firebase-admin"
import { config } from "./config"
import { creditCoins } from "./ledger"

const stripe = new Stripe(config.stripeSecretKey)
const db = admin.firestore()

export async function createCheckoutSession(uid: string, priceId: string, mode: "payment" | "subscription") {
  const userRef = db.collection("UsersDamas").doc(uid)
  const snap = await userRef.get()

  let customerId = snap.data()?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { uid } })
    customerId = customer.id
    await userRef.set({ stripeCustomerId: customerId }, { merge: true })
  }

  const session = await stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.appUrl}/payments/success`,
    cancel_url: `${config.appUrl}/payments/cancel`,
    metadata: { uid, priceId }
  })

  return session.url
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.stripeWebhookSecret
  )

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const uid = session.metadata?.uid
    const priceId = session.metadata?.priceId

    if (!uid || !priceId) return

    const coins = mapPriceToCoins(priceId)
    await creditCoins(uid, coins, session.id, "stripe_payment")
  }
}

function mapPriceToCoins(priceId: string): number {
  const map: Record<string, number> = {
    price_pack_10: 1000,
    price_pack_50: 5000,
    price_sub_month: 10000
  }

  return map[priceId] ?? 0
}
