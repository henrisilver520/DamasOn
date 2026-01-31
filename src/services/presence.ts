import { setUserOnline } from "@/services/users";

// Presença simples em Firestore (best-effort):
// - marca online ao logar
// - heartbeat atualiza lastActivity e mantém isOnline true
// - tenta marcar offline ao sair/fechar aba
// Observação: presença perfeita exige Realtime Database (onDisconnect).

export function startPresence(uid: string) {
  let stopped = false;

  const heartbeat = async () => {
    if (stopped) return;
    try {
      await setUserOnline(uid, true);
    } catch {
      // silencioso: não queremos travar a UI por falha intermitente
    }
  };

  // primeira marcação
  void heartbeat();

  const interval = window.setInterval(heartbeat, 15_000);

  const goOffline = () => {
    // não dá pra garantir em unload; mas tentamos.
    void setUserOnline(uid, false);
  };

  window.addEventListener("beforeunload", goOffline);
  window.addEventListener("pagehide", goOffline);

  return () => {
    stopped = true;
    window.clearInterval(interval);
    window.removeEventListener("beforeunload", goOffline);
    window.removeEventListener("pagehide", goOffline);
    void setUserOnline(uid, false);
  };
}
