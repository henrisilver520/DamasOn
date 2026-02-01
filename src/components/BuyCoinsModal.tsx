// src/components/BuyCoinsModal.tsx
import { useMemo, useState } from "react";
import { startCheckout } from "@/services/payments";

type BuyCoinsModalProps = {
  open: boolean;
  stake?: number;
  balance?: number;
  onClose: () => void;
};

type Offer = {
  title: string;
  description: string;
  priceId: string;
  mode: "payment" | "subscription";
  tag?: string;
};

export function BuyCoinsModal({ open, stake, balance, onClose }: BuyCoinsModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const offers = useMemo<Offer[]>(
    () => [
      {
        title: "Pacote 1.000 moedas",
        description: "Entrada rápida para partidas e apostas menores.",
        priceId: "price_pack_10", // 🔁 TROQUE PELO SEU PRICE ID REAL
        mode: "payment",
      },
      {
        title: "Pacote 5.000 moedas",
        description: "Melhor custo-benefício para jogar com frequência.",
        priceId: "price_pack_50", // 🔁 TROQUE PELO SEU PRICE ID REAL
        mode: "payment",
        tag: "Mais vendido",
      },
      {
        title: "Assinatura mensal",
        description: "Receba moedas todo mês (cobrança recorrente).",
        priceId: "price_sub_month", // 🔁 TROQUE PELO SEU PRICE ID REAL
        mode: "subscription",
        tag: "Plano",
      },
    ],
    []
  );

  if (!open) return null;

  const missing = Math.max(0, (stake ?? 0) - (balance ?? 0));

  async function handleBuy(offer: Offer) {
    try {
      setLoading(offer.priceId);
      await startCheckout(offer.priceId, offer.mode);
    } catch (e) {
      console.error(e);
      alert("Não foi possível iniciar o pagamento. Tente novamente.");
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-amber-600/30 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-amber-200">Saldo insuficiente</h2>
            <p className="mt-1 text-sm text-amber-200/70">
              Você precisa de <b>{stake ?? 0}</b> moedas para entrar nesta mesa.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-amber-200/80 hover:bg-zinc-800"
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-zinc-900/40 p-4">
          <div className="text-sm text-amber-200/80">
            Seu saldo atual: <b className="text-amber-200">{balance ?? 0}</b>
          </div>
          <div className="text-sm text-amber-200/80">
            Falta: <b className="text-amber-200">{missing}</b> moedas
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {offers.map((o) => (
            <div
              key={o.priceId}
              className="flex items-center justify-between gap-4 rounded-2xl border border-amber-600/20 bg-zinc-900/30 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-amber-200">{o.title}</h3>
                  {o.tag && (
                    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
                      {o.tag}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-amber-200/70">{o.description}</p>
              </div>

              <button
                onClick={() => handleBuy(o)}
                disabled={loading !== null}
                className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 px-4 py-2 text-sm font-bold text-zinc-950 disabled:opacity-60"
              >
                {loading === o.priceId ? "Abrindo..." : "Comprar"}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-amber-200/50">
          Pagamentos processados com Stripe. As moedas serão creditadas automaticamente após confirmação.
        </p>
      </div>
    </div>
  );
}
