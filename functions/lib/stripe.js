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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = createCheckoutSession;
exports.handleStripeWebhook = handleStripeWebhook;
const stripe_1 = __importDefault(require("stripe"));
const admin = __importStar(require("firebase-admin"));
const config_1 = require("./config");
const ledger_1 = require("./ledger");
const stripe = new stripe_1.default(config_1.config.stripeSecretKey);
const db = admin.firestore();
async function createCheckoutSession(uid, priceId, mode) {
    const userRef = db.collection("UsersDamas").doc(uid);
    const snap = await userRef.get();
    let customerId = snap.data()?.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({ metadata: { uid } });
        customerId = customer.id;
        await userRef.set({ stripeCustomerId: customerId }, { merge: true });
    }
    const session = await stripe.checkout.sessions.create({
        mode,
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${config_1.config.appUrl}/payments/success`,
        cancel_url: `${config_1.config.appUrl}/payments/cancel`,
        metadata: { uid, priceId }
    });
    return session.url;
}
async function handleStripeWebhook(rawBody, signature) {
    const event = stripe.webhooks.constructEvent(rawBody, signature, config_1.config.stripeWebhookSecret);
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const uid = session.metadata?.uid;
        const priceId = session.metadata?.priceId;
        if (!uid || !priceId)
            return;
        const coins = mapPriceToCoins(priceId);
        await (0, ledger_1.creditCoins)(uid, coins, session.id, "stripe_payment");
    }
}
function mapPriceToCoins(priceId) {
    const map = {
        price_pack_10: 1000,
        price_pack_50: 5000,
        price_sub_month: 10000
    };
    return map[priceId] ?? 0;
}
