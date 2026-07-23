import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import { getApp } from "@react-native-firebase/app";
import { getAuth, getIdToken, GoogleAuthProvider, signInWithCredential } from "@react-native-firebase/auth";

let isConfigured = false;

export const isGoogleSignInConfigured = (): boolean => isConfigured;

// No real Firebase project exists yet — configure() is a deliberate no-op
// (with a console warning) until EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set.
export const configureGoogleSignIn = (): void => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    console.warn("Google web client ID not set — Google sign-in is disabled.");
    return;
  }
  GoogleSignin.configure({ webClientId });
  isConfigured = true;
};

// Returns a Firebase ID token (what the backend verifies via firebase-admin),
// not the raw Google ID token — null means the user cancelled, not an error.
export const signInWithGoogle = async (): Promise<string | null> => {
  if (!isConfigured) {
    throw new Error("Google sign-in isn't set up yet");
  }

  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    return null;
  }
  if (!response.data.idToken) {
    throw new Error("Google sign-in didn't return a token");
  }

  const credential = GoogleAuthProvider.credential(response.data.idToken);
  const auth = getAuth(getApp());
  const userCredential = await signInWithCredential(auth, credential);
  return getIdToken(userCredential.user);
};
