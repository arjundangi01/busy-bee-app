import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { TopBar } from "@/components/navigation/TopBar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { useUpdatePreferences } from "@/module/settings/hooks/useUpdatePreferences";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";

const TOAST_DURATION_MS = 2000;

export function MyAccountTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { user } = useAuthStore();
  const { submit, isLoading, error } = useUpdatePreferences();

  const [name, setName] = useState(user?.name ?? "");
  const [occupation, setOccupation] = useState(user?.occupation ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [age, setAge] = useState(user?.age?.toString() ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [ageError, setAgeError] = useState<string | null>(null);
  const [savedVisible, setSavedVisible] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  if (!user) return null;

  const handleSave = async () => {
    const trimmedAge = age.trim();
    const parsedAge = trimmedAge ? Number(trimmedAge) : undefined;
    if (trimmedAge && (!Number.isInteger(parsedAge) || parsedAge! < 13 || parsedAge! > 120)) {
      setAgeError("Enter a whole number between 13 and 120");
      return;
    }
    setAgeError(null);

    await submit({
      name: name.trim(),
      occupation: occupation.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      ...(parsedAge !== undefined && { age: parsedAge }),
    });

    setSavedVisible(true);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => setSavedVisible(false), TOAST_DURATION_MS);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar variant="sub-screen" title="My Account" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.profileHead}>
            <View style={styles.avatarLg}>
              <Text style={styles.avatarLgGlyph}>{name.charAt(0).toUpperCase() || "?"}</Text>
            </View>
            <Text style={styles.profileName}>{user.name}</Text>
          </View>

          <View style={styles.fields}>
            <TextField placeholder="Name" value={name} onChangeText={setName} autoComplete="name" />
            <TextField placeholder="Occupation" value={occupation} onChangeText={setOccupation} />
            <TextField placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextField value={user.email} editable={false} style={styles.readOnlyField} />
            <TextField placeholder="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
            {ageError && <Text style={styles.errorText}>{ageError}</Text>}
            <TextField placeholder="About you" value={bio} onChangeText={setBio} multiline />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {savedVisible && <Text style={styles.savedText}>Saved</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label="Save changes" onPress={handleSave} loading={isLoading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    profileHead: {
      alignItems: "center",
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    avatarLg: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLgGlyph: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    profileName: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    fields: {
      gap: spacing.sm,
    },
    readOnlyField: {
      color: colors.textSecondary,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
    },
    savedText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
  });
