import React, { useEffect, useMemo, useRef, useState } from "react";
import { listenGameMessages, sendGameMessage, type ChatMessage } from "@/services/chat";
import { useGame } from "@/contexts/GameContext";

export function GameChat({ gameId }: { gameId: string }) {
  const { authUser, profile } = useGame();
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canChat = Boolean(authUser && profile && gameId);

  useEffect(() => {
    if (!gameId) return;
    const unsub = listenGameMessages(gameId, setMsgs);
    return () => unsub();
  }, [gameId]);

  // auto-scroll para última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const myUid = authUser?.uid ?? "";
  const myName = profile?.name ?? "Jogador";

  async function onSend() {
    if (!canChat) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      await sendGameMessage({
        gameId,
        text: trimmed,
        senderUid: myUid,
        senderName: myName,
      });
      setText("");
    } catch (e: any) {
      alert(e?.message ?? "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") onSend();
  }

  return (
    <div className="mt-4 w-full max-w-3xl mx-auto rounded-2xl border border-white/10 bg-black/30 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/90">Chat da partida</h3>
        <span className="text-xs text-white/50">{msgs.length} msgs</span>
      </div>

      <div className="h-52 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
        {msgs.map((m) => {
          const isMine = m.senderUid === myUid;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isMine ? "bg-emerald-500/20 border border-emerald-400/20" : "bg-white/10 border border-white/10"}`}>
                <div className="text-[11px] text-white/60 mb-1">
                  {isMine ? "Você" : m.senderName}
                </div>
                <div className="text-white/90 break-words">{m.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={!canChat || sending}
          placeholder={canChat ? "Digite uma mensagem..." : "Entre na partida para conversar"}
          className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/10"
          maxLength={300}
        />
        <button
          onClick={onSend}
          disabled={!canChat || sending || !text.trim()}
          className="rounded-xl px-4 py-2 text-sm font-semibold bg-white/10 border border-white/10 text-white/90 hover:bg-white/15 disabled:opacity-50"
        >
          {sending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
