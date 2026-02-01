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
exports.creditCoins = creditCoins;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
async function creditCoins(uid, amount, ref, reason) {
    if (amount <= 0)
        return;
    const userRef = db.collection("UsersDamas").doc(uid);
    const ledgerRef = userRef.collection("Ledger").doc(ref);
    await db.runTransaction(async (tx) => {
        const ledgerSnap = await tx.get(ledgerRef);
        if (ledgerSnap.exists)
            return;
        const userSnap = await tx.get(userRef);
        const data = userSnap.data() || {};
        tx.set(userRef, {
            balance: (data.balance || 0) + amount
        }, { merge: true });
        tx.set(ledgerRef, {
            type: "CREDIT",
            amount,
            reason,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
}
