import { db, firebase } from "@/firebase/firebase";

export type ChatMessage = {
  id: string;
  text: string;
  senderUid: string;
  senderName: string;
  createdAt: number; // ms
};

const MAX_MESSAGES = 100;

export function listenGameMessages(
  gameId: string,
  onChange: (msgs: ChatMessage[]) => void
) {
  return db
    .collection("games")
    .doc(gameId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .limitToLast(MAX_MESSAGES)
    .onSnapshot((snap) => {
      const msgs: ChatMessage[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        msgs.push({
          id: d.id,
          text: String(data.text ?? ""),
          senderUid: String(data.senderUid ?? ""),
          senderName: String(data.senderName ?? "Jogador"),
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        });
      });
      onChange(msgs);
    });
}

export async function sendGameMessage(params: {
  gameId: string;
  text: string;
  senderUid: string;
  senderName: string;
}) {
  const text = params.text.trim();
  if (!text) return;
  if (text.length > 300) throw new Error("Mensagem muito longa (máx 300).");

  await db
    .collection("games")
    .doc(params.gameId)
    .collection("messages")
    .add({
      text,
      senderUid: params.senderUid,
      senderName: params.senderName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
}
