import { StyleSheet, View } from "react-native";
import { IColorTokens, useColors } from "@/theme";
import { IStreakCalendarCell } from "@/types";

// design-artifacts/C-UX-Scenarios/02-sams-evening-reckoning/2.2-progress-analytics
// Page-scoped, single use (watch-listed, not yet extracted to the Design System).
// Hit cells are monochrome (colors.text), not accent — color-accent is reserved
// for the wordmark, Companion, and streak-count stat value only (see theme/colors.ts),
// matching how Home Dashboard's own 7-day trend bars were built despite the page
// spec's stale "accent fill" wording.
type StreakCalendarProps = {
  cells: IStreakCalendarCell[];
};

export function StreakCalendar({ cells }: StreakCalendarProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const hitCount = cells.filter((cell) => cell.status === "hit").length;
  const trackedCount = cells.filter((cell) => cell.status !== "no-history").length;

  return (
    <View
      style={styles.grid}
      accessible
      accessibilityLabel={`Streak calendar: ${hitCount} of the last ${trackedCount} tracked days were zero-backlog days`}
    >
      {cells.map((cell) => (
        <View
          key={cell.date}
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.cell,
            cell.status === "hit" && styles.cellHit,
            cell.status === "today" && styles.cellToday,
            cell.status === "no-history" && styles.cellNoHistory,
          ]}
        />
      ))}
    </View>
  );
}

const CELL_SIZE = 16;

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    cell: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      borderRadius: 4,
      backgroundColor: colors.surfaceAlt,
    },
    cellHit: {
      backgroundColor: colors.text,
    },
    cellToday: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.text,
    },
    cellNoHistory: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
  });
