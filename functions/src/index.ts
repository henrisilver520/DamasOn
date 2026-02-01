import * as admin from "firebase-admin";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { joinTableWithWager, settleMatch } from "./wagering";
import { createCheckoutSession, handleStripeWebhook } from "./stripe";

admin.initializeApp();

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://adorable-platypus-4d6896.netlify.app",
    "https://damaonline.netlify.app",
];

// ✅ joinTable (callable) com CORS explícito
export const joinTable = onCall(
  { region: "us-central1", cors: ALLOWED_ORIGINS },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Faça login para entrar na mesa.");

    const tableId = req.data?.tableId;
    if (!tableId) throw new HttpsError("invalid-argument", "tableId é obrigatório.");

    return joinTableWithWager(uid, tableId);
  }
);

// ✅ settleGame (callable) com CORS explícito
export const settleGame = onCall(
  { region: "us-central1", cors: ALLOWED_ORIGINS },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Faça login.");

    const matchId = req.data?.matchId;
    const outcome = req.data?.outcome;

    if (!matchId || !outcome) {
      throw new HttpsError("invalid-argument", "matchId e outcome são obrigatórios.");
    }

    return settleMatch(matchId, outcome);
  }
);

// ✅ createCheckout (callable) com CORS explícito
export const createCheckout = onCall(
  { region: "us-central1", cors: ALLOWED_ORIGINS },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Faça login para comprar moedas.");

    const priceId = req.data?.priceId;
    const mode = req.data?.mode;

    if (!priceId || !mode) {
      throw new HttpsError("invalid-argument", "priceId e mode são obrigatórios.");
    }

    return createCheckoutSession(uid, priceId, mode);
  }
);

// Webhook Stripe não precisa CORS (não é chamado pelo browser)
export const stripeWebhook = onRequest({ region: "us-central1" }, async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (!sig) {
      res.status(400).send("Missing stripe-signature");
      return;
    }

    await handleStripeWebhook(req.rawBody, sig);

    res.status(200).send("ok");
    return;
  } catch (err: any) {
    console.error("stripeWebhook error:", err?.message || err);
    res.status(400).send("Webhook error");
    return;
  }
});
