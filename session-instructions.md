# Session instructions
# Read CLAUDE.md first. Then read feature-expansion-panel-edge-labels.md in full.
# Do not write any code until you have read both files.

## Task

Implement two features as described in feature-expansion-panel-edge-labels.md.
Work through the 7 steps in order. Complete and verify each step before
moving to the next. Do not batch steps.

## Step order (do not skip ahead)

1. Custom edge — midpoint dot resting state only
2. Custom edge — hover bloom animation
3. Custom edge — click to edit label input
4. NodeToolbar expansion panel — render only, no animation
5. NodeToolbar — smart position flip logic
6. NodeToolbar — entrance animation
7. Remove in-place .revealed expansion from CSS

## After each step

State exactly which files were changed and what was not touched.
Do not move to the next step until you confirm the current step works.

## Hard rules

- Use React Flow's NodeToolbar component for the expansion panel
- Use React Flow's EdgeLabelRenderer for the edge midpoint
- Do not use any external animation library
- Do not touch AnchorNode, sidebar, session logic, satellite/cluster code,
  or any AI/API calls
- No font-weight above 400 anywhere in new components
- All colours must use tokens from CLAUDE.md — no hardcoded values
  except where exact hex values are specified in the feature spec
