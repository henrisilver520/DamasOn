import { db, firebase, storage } from "@/firebase/firebase";
import type { UserProfile } from "@/types/domain";

const USERS = "UsersDamas";

type UserProfilePayload = Omit<UserProfile, "isOnline" | "balance" | "locked"> & {
  balance?: number;
  locked?: number;
};

export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  // caminho fixo (sobrescreve foto antiga)
  const ref = storage.ref().child(`userdamas/${uid}/profile.jpg`);
  await ref.put(file);
  return await ref.getDownloadURL();
}

export async function upsertUserProfile(profile: UserProfilePayload) {
  const ref = db.collection(USERS).doc(profile.uid);
  const snap = await ref.get();

  const base = {
    ...profile,
    isOnline: true,
    lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  if (!snap.exists) {
    await ref.set({
      ...base,
      balance: profile.balance ?? 0,
      locked: profile.locked ?? 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    if (profile.balance !== undefined) {
      base.balance = profile.balance;
    }
    if (profile.locked !== undefined) {
      base.locked = profile.locked;
    }
    await ref.set(base, { merge: true });
  }
}

export async function setUserOnline(uid: string, isOnline: boolean) {
  await db.collection(USERS).doc(uid).set(
    {
      isOnline,
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export function listenUserProfile(uid: string, onChange: (p: UserProfile | null) => void) {
  return db.collection(USERS).doc(uid).onSnapshot((snap) => {
    if (!snap.exists) return onChange(null);
    const d = snap.data() as any;

    const profile: UserProfile = {
      uid,
      name: d.name ?? "",
      email: d.email ?? "",
      country: d.country ?? "",
      city: d.city ?? "",
      age: Number(d.age ?? 0),
      photoURL: d.photoURL ?? "",
      balance: Number(d.balance ?? 0),
      locked: Number(d.locked ?? 0),
      isOnline: Boolean(d.isOnline),
      lastActivity: d.lastActivity?.toMillis?.() ?? undefined,
      createdAt: d.createdAt?.toMillis?.() ?? undefined,
    };

    onChange(profile);
  });
}

export function listenOnlineUsers(onChange: (users: UserProfile[]) => void) {
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
          country: data.country ?? "",
          city: data.city ?? "",
          age: Number(data.age ?? 0),
          photoURL: data.photoURL ?? "",
          balance: Number(data.balance ?? 0),
          locked: Number(data.locked ?? 0),
          isOnline: Boolean(data.isOnline),
          lastActivity: data.lastActivity?.toMillis?.() ?? undefined,
          createdAt: data.createdAt?.toMillis?.() ?? undefined,
        });
      });

      onChange(users);
    });
}
