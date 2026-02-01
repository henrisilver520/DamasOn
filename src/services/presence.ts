import { db, firebase } from "@/firebase/firebase";

const USERS = "UsersDamas";

export function startPresence(uid: string) {
  const ref = db.collection(USERS).doc(uid);

  // online ao iniciar
  ref.set(
    {
      isOnline: true,
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const onUnload = () => {
    ref.set(
      {
        isOnline: false,
        lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  };

  window.addEventListener("beforeunload", onUnload);

  // heartbeat opcional (bom p/ mobile)
  const interval = window.setInterval(() => {
    ref.set(
      {
        isOnline: true,
        lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }, 30000);

  return () => {
    window.removeEventListener("beforeunload", onUnload);
    window.clearInterval(interval);
    // marca offline ao parar
    onUnload();
  };
}
