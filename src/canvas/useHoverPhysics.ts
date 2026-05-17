// Spring physics for hover repulsion / attraction.
// Physics is computed imperatively in useFrame — no external library needed.

const REPULSION_RADIUS  = 180; // canvas units from cursor center
const ATTRACTION_RADIUS = 350;
const MAX_REPULSION     = 24;  // max displacement in canvas units
const MAX_ATTRACTION    =  8;

// Spring simulation parameters (matches @react-spring config mass:1, tension:120, friction:20)
const SPRING_K = 120;
const SPRING_D =  20;

export interface SpringState {
  ox: number; oy: number;
  vx: number; vy: number;
}

export function makeSpringState(): SpringState {
  return { ox: 0, oy: 0, vx: 0, vy: 0 };
}

// Compute the target displacement for a fragment given cursor position.
// Returns (0,0) when cursor is outside attraction zone or physics is inactive.
export function computePhysicsTarget(
  cursorX: number, cursorY: number,
  fragmentX: number, fragmentY: number,
  active: boolean,
): { targetOx: number; targetOy: number } {
  if (!active) return { targetOx: 0, targetOy: 0 };

  const dx   = fragmentX - cursorX;
  const dy   = fragmentY - cursorY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.001) return { targetOx: 0, targetOy: 0 };

  if (dist < REPULSION_RADIUS) {
    const force = (1 - dist / REPULSION_RADIUS) * MAX_REPULSION;
    return { targetOx: (dx / dist) * force, targetOy: (dy / dist) * force };
  }
  if (dist < ATTRACTION_RADIUS) {
    const force = (1 - dist / ATTRACTION_RADIUS) * 0.3 * MAX_ATTRACTION;
    return { targetOx: -(dx / dist) * force, targetOy: -(dy / dist) * force };
  }
  return { targetOx: 0, targetOy: 0 };
}

// Step the spring simulation one frame forward (delta in seconds).
// Mutates state in place for zero allocation per frame.
export function stepSpring(
  state: SpringState,
  targetOx: number, targetOy: number,
  delta: number,
): void {
  // Clamp delta to avoid explosion on tab switch / lag spikes
  const dt = Math.min(delta, 0.05);
  const ax = (targetOx - state.ox) * SPRING_K;
  const ay = (targetOy - state.oy) * SPRING_K;
  state.vx = (state.vx + ax * dt) * (1 - SPRING_D * dt);
  state.vy = (state.vy + ay * dt) * (1 - SPRING_D * dt);
  state.ox += state.vx * dt;
  state.oy += state.vy * dt;
}
