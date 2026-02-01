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
exports.joinTableWithWager = joinTableWithWager;
exports.settleMatch = settleMatch;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const db = admin.firestore();
async function joinTableWithWager(uid, tableId) {
    const tableRef = db.collection("Tables").doc(tableId);
    const userRef = db.collection("UsersDamas").doc(uid);
    return db.runTransaction(async (tx) => {
        const [tableSnap, userSnap] = await Promise.all([
            tx.get(tableRef),
            tx.get(userRef)
        ]);
        if (!tableSnap.exists) {
            throw new https_1.HttpsError("not-found", "Mesa não encontrada");
        }
        const table = tableSnap.data();
        const stake = Number(table.stake);
        const user = userSnap.data() || {};
        const balance = Number(user.balance || 0);
        const locked = Number(user.locked || 0);
        if (balance < stake) {
            return {
                ok: false,
                reason: "INSUFFICIENT_BALANCE",
                stake,
                balance
            };
        }
        tx.set(userRef, {
            balance: balance - stake,
            locked: locked + stake
        }, { merge: true });
        return { ok: true };
    });
}
async function settleMatch(matchId, outcome) {
    const matchRef = db.collection("Matches").doc(matchId);
    return db.runTransaction(async (tx) => {
        const matchSnap = await tx.get(matchRef);
        if (!matchSnap.exists) {
            throw new https_1.HttpsError("not-found", "Match não encontrado");
        }
        const match = matchSnap.data();
        if (match.status === "settled")
            return;
        const stake = match.stake;
        const { a, b } = match.players;
        const aRef = db.collection("UsersDamas").doc(a);
        const bRef = db.collection("UsersDamas").doc(b);
        const [aSnap, bSnap] = await Promise.all([
            tx.get(aRef),
            tx.get(bRef)
        ]);
        const aData = aSnap.data() || {};
        const bData = bSnap.data() || {};
        tx.set(aRef, { locked: (aData.locked || 0) - stake }, { merge: true });
        tx.set(bRef, { locked: (bData.locked || 0) - stake }, { merge: true });
        if (outcome.type === "WIN") {
            const winnerRef = db.collection("UsersDamas").doc(outcome.winnerUid);
            const winSnap = await tx.get(winnerRef);
            const winData = winSnap.data() || {};
            tx.set(winnerRef, {
                balance: (winData.balance || 0) + stake * 2
            }, { merge: true });
        }
        if (outcome.type === "DRAW" || outcome.type === "CANCEL") {
            tx.set(aRef, { balance: (aData.balance || 0) + stake }, { merge: true });
            tx.set(bRef, { balance: (bData.balance || 0) + stake }, { merge: true });
        }
        tx.set(matchRef, {
            status: "settled",
            outcome,
            settledAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    });
}
