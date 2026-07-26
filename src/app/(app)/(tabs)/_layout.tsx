import { Tabs } from "expo-router";
import { ColorValue, Text } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { useColors } from "@/theme";

// Custom monochrome glyph (not an emoji) — emoji render full-color and would
// break the "tab bar active state is monochrome per DS-004" rule the other
// three tabs' plain-text Unicode glyphs already respect via `color`. React
// Navigation types tabBarIcon's color as ColorValue; react-native-svg's
// color props want a plain string, and every color this app ever produces
// (theme tokens, all hex/rgba strings) already is one.
function BeeTabIcon({ color }: { color: ColorValue }) {
  const strokeColor = color as string;
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Ellipse cx="9" cy="12" rx="4.5" ry="3.5" fill="none" stroke={strokeColor} strokeWidth={1.4} />
      <Path d="M6 10.5 Q9 9 12 10.5" stroke={strokeColor} strokeWidth={1.2} fill="none" />
      <Path d="M6 13.5 Q9 15 12 13.5" stroke={strokeColor} strokeWidth={1.2} fill="none" />
      <Ellipse cx="16" cy="9" rx="3.5" ry="2.2" fill="none" stroke={strokeColor} strokeWidth={1.2} transform="rotate(-20 16 9)" />
      <Ellipse cx="16" cy="14.5" rx="3.5" ry="2.2" fill="none" stroke={strokeColor} strokeWidth={1.2} transform="rotate(20 16 14.5)" />
    </Svg>
  );
}

export default function TabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Tab bar active state is monochrome per DS-004 — color-accent is
        // reserved for the wordmark, Companion, and streak stat only.
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⬢</Text>,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>◷</Text>,
        }}
      />
      <Tabs.Screen
        name="bees-hive"
        options={{
          title: "Bee",
          tabBarIcon: ({ color }) => <BeeTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>☰</Text>,
        }}
      />
    </Tabs>
  );
}
