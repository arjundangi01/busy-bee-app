import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { IColorTokens, radius, spacing, useColors } from "@/theme";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// This app's first confirmation modal — deliberately not React Native's
// Alert.alert (can't be styled to match the app — see code-practice-fe.md's
// own rule against it). A themed overlay + card instead. The "safe" action
// (cancel/stay) gets the bold PrimaryButton treatment and the destructive
// one (confirm/leave) stays a plain text link, nudging toward the
// non-lossy choice without being preachy about it.
export function ConfirmDialog({ visible, title, body, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.actions}>
            <PrimaryButton label={cancelLabel} onPress={onCancel} />
            <Pressable onPress={onConfirm} hitSlop={8} style={styles.confirmLink}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
    },
    card: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    title: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    body: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: spacing.sm,
    },
    actions: {
      gap: spacing.xs,
    },
    confirmLink: {
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    confirmText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
