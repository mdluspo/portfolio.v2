export const CRUISE_SPEED = 3;
export const SCENERY_PACE = 2.2;
export const MAX_SPEED = 18;
export const STEERING_MAX_SPEED = 36;
export const createDrive = () => ({speed: CRUISE_SPEED, boost: 0, distance: 0});

export function accelerate(state, wheelPixels) {
  const limit = Math.max(MAX_SPEED - CRUISE_SPEED, state.boost);
  return {...state, boost: Math.min(limit,
    state.boost + Math.min(240, Math.abs(wheelPixels)) * .045)};
}

// Spinning the rim gives an immediate surge as well as sustained acceleration.
export function accelerateSteering(state, turn) {
  const force = Math.min(120, Math.abs(turn));
  return {...state,
    speed: Math.min(STEERING_MAX_SPEED, state.speed + force * .09),
    boost: Math.min(STEERING_MAX_SPEED - CRUISE_SPEED, state.boost + force * .26)};
}

export function advanceDrive(state, delta) {
  const boost = state.boost * Math.exp(-.5 * delta);
  const target = CRUISE_SPEED + boost;
  const speed = state.speed + (target - state.speed) * (1 - Math.exp(-12 * delta));
  return {speed, boost, distance: state.distance + (state.speed + speed) * .5 * delta};
}

// Project a repeating world segment toward the viewer. Reset occurs either at the vanishing
// point (subpixel size) or beyond the windshield, never in the visible foreground.
export function depthAt(distance, offset = 0, period = 4) {
  const phase = distance / period + offset;
  return (phase - Math.floor(phase)) ** 2.8;
}

// The rear view recedes into the horizon, opposite the approaching windshield view.
export function rearDepthAt(distance, offset = 0, period = 3.6) {
  const phase = distance / period + offset;
  return (1 - (phase - Math.floor(phase))) ** 2.8;
}
