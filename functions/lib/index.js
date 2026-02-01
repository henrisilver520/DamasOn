"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.createCheckout = exports.settleGame = exports.joinTable = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const wagering_1 = require("./wagering");
const stripe_1 = require("./stripe");
admin.initializeApp();
const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://adorable-platypus-4d6896.netlify.app",
];
// ✅ joinTable (callable) com CORS explícito
exports.joinTable = (0, https_1.onCall)({ region: "us-central1", cors: ALLOWED_ORIGINS }, async (req) => {
    const uid = req.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Faça login para entrar na mesa.");
    const tableId = req.data?.tableId;
    if (!tableId)
        throw new https_1.HttpsError("invalid-argument", "tableId é obrigatório.");
    return (0, wagering_1.joinTableWithWager)(uid, tableId);
});
// ✅ settleGame (callable) com CORS explícito
exports.settleGame = (0, https_1.onCall)({ region: "us-central1", cors: ALLOWED_ORIGINS }, async (req) => {
    const uid = req.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Faça login.");
    const matchId = req.data?.matchId;
    const outcome = req.data?.outcome;
    if (!matchId || !outcome) {
        throw new https_1.HttpsError("invalid-argument", "matchId e outcome são obrigatórios.");
    }
    return (0, wagering_1.settleMatch)(matchId, outcome);
});
// ✅ createCheckout (callable) com CORS explícito
exports.createCheckout = (0, https_1.onCall)({ region: "us-central1", cors: ALLOWED_ORIGINS }, async (req) => {
    const uid = req.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Faça login para comprar moedas.");
    const priceId = req.data?.priceId;
    const mode = req.data?.mode;
    if (!priceId || !mode) {
        throw new https_1.HttpsError("invalid-argument", "priceId e mode são obrigatórios.");
    }
    return (0, stripe_1.createCheckoutSession)(uid, priceId, mode);
});
// Webhook Stripe não precisa CORS (não é chamado pelo browser)
exports.stripeWebhook = (0, https_1.onRequest)({ region: "us-central1" }, async (req, res) => {
    try {
        const sig = req.headers["stripe-signature"];
        if (!sig) {
            res.status(400).send("Missing stripe-signature");
            return;
        }
        await (0, stripe_1.handleStripeWebhook)(req.rawBody, sig);
        res.status(200).send("ok");
        return;
    }
    catch (err) {
        console.error("stripeWebhook error:", err?.message || err);
        res.status(400).send("Webhook error");
        return;
    }
});
