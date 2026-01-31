import { auth } from "@/firebase/firebase";

export async function signUpEmailPassword(email: string, password: string) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  if (!cred.user) throw new Error("Falha ao criar usuário");
  return cred.user;
}

export async function signInEmailPassword(email: string, password: string) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  if (!cred.user) throw new Error("Falha ao entrar");
  return cred.user;
}

export async function signOut() {
  await auth.signOut();
}

export function onAuthStateChanged(cb: Parameters<typeof auth.onAuthStateChanged>[0]) {
  return auth.onAuthStateChanged(cb);
}
