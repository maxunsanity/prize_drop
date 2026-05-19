import { z } from "zod";

/** HUD Spec 동적 필드 — `{ $state: "/hud/…" }` 또는 초깃값 리터럴 */
export const hudBindProp = z.union([
  z.object({
    $state: z
      .string()
      .regex(/^\/hud\//)
      .describe("hudExternalStore 경로 — Spec 과 syncMonopolyHud 가 세트"),
  }),
  z.string(),
  z.number(),
  z.boolean(),
]);

export const emptySceneProps = z.object({});
