import { View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { useColors } from "@/theme";

// Page-scoped, single use (watch-listed). Single series, no axes/gridlines —
// only the endpoint marker is emphasized, per spec.
type SparklineProps = {
  values: number[];
  height?: number;
};

const VIEWBOX_WIDTH = 100;

export function Sparkline({ values, height = 40 }: SparklineProps) {
  const colors = useColors();

  if (values.length === 0) {
    return null;
  }

  const maxValue = Math.max(...values, 1);
  const padding = 4;
  const usableHeight = height - padding * 2;

  const points = values.map((value, index) => {
    const x = values.length === 1 ? VIEWBOX_WIDTH / 2 : (index / (values.length - 1)) * VIEWBOX_WIDTH;
    const y = height - padding - (value / maxValue) * usableHeight;
    return { x, y };
  });

  const lastPoint = points[points.length - 1];

  return (
    <View accessible accessibilityLabel={`Focus duration trend, most recent week ${values[values.length - 1]} minutes average`}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`} preserveAspectRatio="none">
        {points.length > 1 && (
          <Polyline
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke={colors.textSecondary}
            strokeWidth={2}
          />
        )}
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={colors.text} />
      </Svg>
    </View>
  );
}
