"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    appUrl: process.env.APP_URL
};
function assertEnv() {
    for (const [key, value] of Object.entries(exports.config)) {
        if (!value)
            throw new Error(`Missing env var: ${key}`);
    }
}
assertEnv();
