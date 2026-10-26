export interface UserAuth {
  name: string;
  email: string;
  loginTime: Date;
}

const AUTH_KEY = 'arc_ai_user_auth';

export const saveAuth = (name: string, email: string): void => {
  const auth: UserAuth = {
    name,
    email,
    loginTime: new Date()
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
};

export const getAuth = (): UserAuth | null => {
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    const auth = JSON.parse(stored);
    auth.loginTime = new Date(auth.loginTime);
    return auth;
  }
  return null;
};

export const clearAuth = (): void => {
  localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
  return getAuth() !== null;
};
