import { Switch } from "react-native";
import { useColors } from "@/theme";

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
};

export function Toggle({ value, onValueChange, disabled, accessibilityLabel }: ToggleProps) {
  const colors = useColors();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.border, true: colors.invertFill }}
      ios_backgroundColor={colors.border}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
