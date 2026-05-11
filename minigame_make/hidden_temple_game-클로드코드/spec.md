# GAME.md Format

GAME.md is a self-contained, plain-text representation of a game design. It gives AI agents and developers a persistent, complete understanding of a game—from rules and entities to design intent and content guidelines—so that decisions stay consistent across sessions and tools.

A GAME.md file has two parts: **YAML front matter** (machine-readable game structure) and a **Markdown body** (human-readable rationale and guardrails). The YAML holds normative mechanics, entities, and goals; the prose explains *why* those choices exist and how to extend or avoid breaking the game. This mirrors how [DESIGN.md](https://github.com/google-labs-code/design.md) separates tokens from prose; see [their format spec](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md) for the parallel pattern.

The front matter block must begin with a line containing exactly `---` and end with a line containing exactly `---`. The YAML between those delimiters is parsed according to the schema defined below.

Example shape:

```
---
identity: ...
components: ...
entities: ...
mechanics: ...
goals: ...
---

## Design Pillars
## Mechanics in Depth
## Content Guidelines
## Anti-Patterns
```

## Schema

Below is the schema for the YAML defined in the front matter:

```yaml
identity:
  name: <string>
  genre: <string[]>              # tag list, not exclusive categories
  platform: <string[]>
  players: <int | "N-M">         # single int or bounded range string
  pitch: <string>                # one sentence; north star for judgment calls

components:
  <component-name>:
    <field-name>:
      type: int | float | string | bool | enum | vec2 | list | ref
      range: [<min>, <max>]       # inclusive, for numeric types
      values: []                  # for enum types
      items: <entity-name>        # for list types referencing another entity
      default: <value>            # initial value at game start
    states: []                    # optional; exhaustive lifecycle states for this component

entities:
  <entity-name>:
    components: [<component-name>, ...]
    states: [<state>, ...]
    count: <int>                  # optional — fixed multiplicity
  # or shorthand when no shared components:
  <entity-name>:
    attributes:
      <field-name>: <type>

mechanics:
  turn_structure: realtime | turn-based | phase-based
  actions:
    <action-name>:
      actor: <entity-name>
      params:
        <param-name>: <type or enum(a|b|c)>
      preconditions:
        - "<readable pseudo-code guard>"
      effects:
        - "<readable pseudo-code outcome>"
  loops:
    - name: <string>
      description: "<what repeats and why>"

goals:
  win:
    - condition: "<plain English>"
  loss:
    - condition: "<plain English>"
  draw:                             # optional
    - condition: "<plain English>"
  score:                            # optional
    - metric: <metric-name>
      formula: "<plain English or arithmetic expression>"
```

### `identity`

Stable anchor for the file. Agents treat `pitch` as the north star when something is not spelled out elsewhere.

- `genre` is a free tag list (e.g. `[roguelike, turn-based]`). Multiple tags apply at once; none is mutually exclusive by convention.
- `players` is either a single integer (`1`, `2`) or a bounded range string (`"1-4"`). Open-ended ranges such as `"2+"` are **not** supported—use the maximum known player count.
- `pitch` should be exactly one sentence.

### `components`

Reusable attribute bundles: define once, reference from multiple entities (`entities` references components instead of repeating fields).

- `type` is one of: `int`, `float`, `string`, `bool`, `enum`, `vec2`, `list`, `ref`.
- `states` on a **component** models component-local lifecycle (for example AI patrol/chase). `states` on an **entity** models entity-level lifecycle (for example alive/dead/respawning). Use whichever owns the lifecycle.

### `entities`

Every distinct game object. ECS-style: entities list `components`, or use inline `attributes` for simple entities with no shared behavior.

- Optional `count` documents fixed multiplicity (for example four players).

### `mechanics`

What can happen in the game.

- **`turn_structure`** — structurally drives how time and sequencing are reasoned about.
- **`actions`** — **exhaustive** set of valid actions. Consumers should treat any action not listed as invalid **unless** the Markdown body explicitly allows it.
- **`preconditions`** and **`effects`** — readable pseudo-code: precise enough to implement, **not** required to be syntactically valid in any programming language.
- **`loops`** — named recurring patterns formed by actions; they describe rhythms, not step-by-step procedures.

### `goals`

How the session or match ends.

- Multiple entries under `win` or `loss` mean **distinct paths** to that outcome.
- `draw` — include only when the game has explicit draw conditions.
- `score` — omit entirely when the game has no scoring. Conditions remain plain English (or simple formulas where appropriate).

---

# Sections (Markdown Body)

Every GAME.md body uses the **same fixed prose headings** immediately after the front matter closes. Agents may rely on these four names for navigation.

An optional `#` document title above `## Design Pillars` is allowed for human readers; parsers should treat the four `##` sections below as the normative prose structure.

### Section Order

1. **Design Pillars**
2. **Mechanics in Depth**
3. **Content Guidelines**
4. **Anti-Patterns**

Authors **may** add additional `##` sections. Consumers should read them as context but must **not** depend on their names programmatically unless extended by a project-local convention.

## Design Pillars

2–4 named principles describing what the game should *feel* like.

**Format:** `**Name** — One sentence.` per pillar.

Agents use these as tie-breakers when the YAML alone does not decide a behavior.

Example:

```markdown
## Design Pillars

**Tension over comfort** — Every room should feel like it could kill you.
**Meaningful choice** — No action should be obviously correct.
```

## Mechanics in Depth

Prose explaining how YAML mechanics interact, edge cases, and why specific numeric or structural choices were made—the *why* behind the rules.

## Content Guidelines

How to add new content (enemies, cards, levels, items, variants, etc.) so it stays on-model. Agents should read this before generating or refactoring content.

## Anti-Patterns

What breaks feel or violates a pillar—so agents avoid reintroducing known mistakes.

---

# Consumer Behavior for Unknown Content

When a GAME.md consumer encounters content not defined by this spec:

| Scenario | Behavior | Example |
|----------|----------|---------|
| Unknown top-level YAML key under `identity`, `components`, `entities`, `mechanics`, or `goals` | Preserve or warn per implementation; do not silently drop without policy | Extra `meta:` block |
| Additional prose section (`##`) after the four fixed sections | Preserve; treat as non-normative unless project docs say otherwise | `## Lore Appendix` |
| Unknown `##` inserted **between** fixed sections such that section order diverges | Prefer warning; deterministic parsers may assume document order matches spec | `## Notes` between Pillars and Mechanics |
| Action not listed in `mechanics.actions` | Treat as invalid unless prose explicitly permits | Undeclared `teleport` |
| Open-ended `players` like `"2+"` | Reject or normalize per tool; not in spec | `"2+"` |

---

# Complete Annotated Template

```markdown
---
identity:
  name: ""
  genre: []
  platform: []
  players: 1
  pitch: ""

components:
  # Reusable bundles with typed fields / states

entities:
  # entity-name: { components: [...], states: [...], count: N }

mechanics:
  turn_structure: realtime   # realtime | turn-based | phase-based

  actions:
    # action-name:
    #   actor: entity-name
    #   params: {}
    #   preconditions: []
    #   effects: []

  loops:
    # - name: ""
    #   description: ""

goals:
  win:
    - condition: ""
  loss:
    - condition: ""
  # draw:
  #   - condition: ""
  # score:
  #   - metric: ""
  #     formula: ""
---

## Design Pillars

**Pillar name** — One sentence.

## Mechanics in Depth

## Content Guidelines

## Anti-Patterns
```
