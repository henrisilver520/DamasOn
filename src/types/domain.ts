export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  country?: string;   // ✅ novo
  city: string;
  age: number;
  photoURL?: string;  // ✅ novo
  isOnline: boolean;
  lastActivity?: number;
  createdAt?: number;
};


export type TableKind = "free" | "bet";
export type TableStatus = "waiting" | "playing" | "canceled" | "finished";

export type TableDoc = {
  id: string;
  createdAt: number;
  createdByUid: string;
  createdByName: string;
  createdByCity?: string;
  createdByAge?: number;
  kind: TableKind;
  betAmount?: number;
  status: TableStatus;
  opponentUid?: string;
  opponentName?: string;
};

// Alias for compatibility
export type Table = TableDoc;
