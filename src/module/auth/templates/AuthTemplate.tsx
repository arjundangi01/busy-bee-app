import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Companion } from "@/components/content/Companion";
import { BackButton } from "@/components/ui/BackButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { useSignIn } from "@/module/auth/hooks/useSignIn";
import { useSignUp } from "@/module/auth/hooks/useSignUp";
import { useOnboardingPermissions } from "@/module/onboarding/context/OnboardingPermissionsContext";
import { routes } from "@/config/routes";
import { IColorTokens, spacing, useColors } from "@/theme";

const MIN_PASSWORD_LENGTH = 8;

type AuthMode = "sign-up" | "sign-in";

type AuthTemplateProps = {
  initialMode: AuthMode;
};

export function AuthTemplate({ initialMode }: AuthTemplateProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = useSignUp();
  const signIn = useSignIn();
  const { permissions } = useOnboardingPermissions();

  const isSignUp = mode === "sign-up";
  const { isLoading, error } = isSignUp ? signUp : signIn;

  const canSubmit = isSignUp
    ? name.trim().length > 0 && email.includes("@") && password.length >= MIN_PASSWORD_LENGTH
    : email.includes("@") && password.length > 0;

  const handleSubmit = async () => {
    if (isSignUp) {
      await signUp.submit({
        name: name.trim(),
        email: email.trim(),
        password,
        backgroundExecutionGranted: permissions.backgroundExecutionGranted,
        notificationsGranted: permissions.notificationsGranted,
      });
    } else {
      await signIn.submit({ email: email.trim(), password });
    }
    router.replace(routes.tabs.home());
  };

  const toggleMode = () => {
    setMode(isSignUp ? "sign-in" : "sign-up");
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topbar}>
        <BackButton onPress={() => router.back()} />
      </View>

      <View style={styles.content}>
        {isSignUp && (
          <View style={styles.companionRow}>
            <Companion state="mentioned" caption="One last thing before we start." />
          </View>
        )}

        <View style={styles.headlineZone}>
          <Text style={styles.headline}>{isSignUp ? "Create your account" : "Welcome back."}</Text>
          <Text style={styles.subline}>
            {isSignUp
              ? "So your streak and progress aren't lost — even if you switch phones."
              : "Sign in to pick up where you left off."}
          </Text>
        </View>

        <View style={styles.social}>
          <View style={styles.socialButton}>
            <Text style={styles.socialLabel}>Continue with Apple</Text>
          </View>
          <View style={styles.socialButton}>
            <Text style={styles.socialLabel}>Continue with Google</Text>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or with email</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <TextField placeholder="Name" value={name} onChangeText={setName} autoComplete="name" />
          )}
          <TextField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isSignUp ? "password-new" : "password"}
          />
          {isSignUp && <Text style={styles.helper}>At least {MIN_PASSWORD_LENGTH} characters.</Text>}
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={isSignUp ? "Create account" : "Sign in"}
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={isLoading}
        />
        <Pressable onPress={toggleMode} hitSlop={12} style={styles.switchLink}>
          <Text style={styles.switchText}>
            {isSignUp ? "Already have an account? " : "New here? "}
            <Text style={styles.switchTextBold}>{isSignUp ? "Sign in" : "Create an account"}</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    topbar: {
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    companionRow: {
      marginBottom: spacing.md,
    },
    headlineZone: {
      gap: spacing.xxs,
      marginTop: spacing.md,
    },
    headline: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    subline: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    social: {
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    socialButton: {
      height: 52,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.4,
    },
    socialLabel: {
      color: colors.textFaint,
      fontSize: 15,
      fontWeight: "600",
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    form: {
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    helper: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    error: {
      color: colors.danger,
      fontSize: 11,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.xs,
    },
    switchLink: {
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    switchText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    switchTextBold: {
      color: colors.text,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
  });
