export const tokenUtils = {
  isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      return Math.floor(new Date().getTime() / 1000) >= expiry;
    } catch (e) {
      console.warn('[tokenUtils] Failed to parse token payload', e);
      return true;
    }
  },
};
