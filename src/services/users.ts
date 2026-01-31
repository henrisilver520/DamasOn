import { db, firebase } from "@/firebase/firebase";
import type { UserProfile } from "@/types/domain";

const USERS = "users";

export async function upsertUserProfile(profile: Omit<UserProfile, "isOnline">) {
  const ref = db.collection(USERS).doc(profile.uid);
  await ref.set(
    {
      ...profile,
      isOnline: true,
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function setUserOnline(uid: string, isOnline: boolean) {
  await db
    .collection(USERS)
    .doc(uid)
    .set(
      {
        isOnline,
        lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export function listenOnlineUsers(onChange: (users: UserProfile[]) => void) {
  // Firestore v8: orderBy + where isOnline true
  return db
    .collection(USERS)
    .where("isOnline", "==", true)
    .onSnapshot((snap) => {
      const users: UserProfile[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        users.push({
          uid: d.id,
          name: data.name ?? "",
          email: data.email ?? "",
          city: data.city ?? "",
          age: Number(data.age ?? 0),
          isOnline: Boolean(data.isOnline),
          lastActivity: data.lastActivity?.toMillis?.() ?? undefined,
          createdAt: data.createdAt?.toMillis?.() ?? undefined,
        });
      });
      onChange(users);
    });
}
