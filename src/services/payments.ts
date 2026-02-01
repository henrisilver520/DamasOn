// src/services/payments.ts
import { functions } from "@/firebase/firebase";

export type CheckoutMode = "payment" | "subscription";

export async function startCheckout(priceId: string, mode: CheckoutMode) {
  const callable = functions.httpsCallable("createCheckout");
  const res = await callable({ priceId, mode });

  // dependendo de como você retornou no backend, pode ser string ou objeto
  const url = typeof res.data === "string" ? res.data : (res.data?.url as string | undefined);

  if (!url) {
    throw new Error("Checkout URL não retornada pela função createCheckout.");
  }

  window.location.href = url;
}
