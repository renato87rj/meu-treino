export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}
