export type CoinOffer = {
  title: string;
  description: string;
  priceId: string;
  mode: "payment" | "subscription";
  tag?: string;
};

// 🔁 Troque pelos Price IDs reais do seu Stripe.
export const coinOffers: CoinOffer[] = [
  {
    title: "Pacote 1.000 moedas",
    description: "Entrada rápida para partidas e apostas menores.",
    priceId: "price_pack_10",
    mode: "payment",
  },
  {
    title: "Pacote 5.000 moedas",
    description: "Melhor custo-benefício para jogar com frequência.",
    priceId: "price_pack_50",
    mode: "payment",
    tag: "Mais vendido",
  },
  {
    title: "Assinatura mensal",
    description: "Receba moedas todo mês (cobrança recorrente).",
    priceId: "price_sub_month",
    mode: "subscription",
    tag: "Plano",
  },
];
