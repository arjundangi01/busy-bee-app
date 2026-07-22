import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_TOKEN_KEY = "busy-bee/session-token";

let cachedToken: string | null | undefined;

export const getStoredToken = async (): Promise<string | null> => {
  if (cachedToken !== undefined) {
    return cachedToken;
  }

  const stored = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
  cachedToken = stored;
  return stored;
};

export const setStoredToken = async (token: string): Promise<void> => {
  cachedToken = token;
  await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
};

export const clearStoredToken = async (): Promise<void> => {
  cachedToken = null;
  await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
};
