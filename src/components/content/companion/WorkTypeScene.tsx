import { HoneycombScene } from "@/components/content/companion/HoneycombScene";
import { FlowerFieldScene } from "@/components/content/companion/FlowerFieldScene";
import type { BeeSkin } from "@/components/content/companion/BeeCharacter";
import type { HiveThemePalette } from "@/components/content/companion/WorkshopEnvironment";

// design-artifacts/evolution/specs/03-companion-work-types.md — one scene
// component per work type, keyed by the backend WorkType registry's stable
// `key` (see backend/scripts/seed-work-types.ts). Adding a new work type
// later is a new Scene component + one entry here, matching the registry's
// own extensible intent — never a branch scattered across Companion.tsx.
export type WorkTypeSceneProps = {
  currentUnit: number;
  totalUnits: number;
  reacting: boolean;
  // The user's selected Bee's Hive appearance skin — undefined falls back
  // to BeeCharacter's own default colors.
  skin?: BeeSkin;
  // The user's selected Bee's Hive environment theme — undefined falls back
  // to WorkshopEnvironment's own default (Golden Hour) palette.
  theme?: HiveThemePalette;
};

type SceneComponent = (props: WorkTypeSceneProps) => React.JSX.Element;

const SCENE_BY_WORK_TYPE_KEY: Record<string, SceneComponent> = {
  "honeycomb-building": HoneycombScene,
  "flower-collecting": FlowerFieldScene,
};

type WorkTypeSceneWrapperProps = WorkTypeSceneProps & {
  workTypeKey: string | undefined;
};

export function WorkTypeScene({ workTypeKey, ...sceneProps }: WorkTypeSceneWrapperProps) {
  const Scene = (workTypeKey && SCENE_BY_WORK_TYPE_KEY[workTypeKey]) || HoneycombScene;
  return <Scene {...sceneProps} />;
}
