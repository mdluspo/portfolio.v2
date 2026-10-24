const wave = (seconds, period, phase = 0) => Math.sin(seconds * Math.PI * 2 / period + phase);
const steering = seconds => 16 * wave(seconds, 4.6, -.4) + 3 * wave(seconds, 1.7);
const lateralLoad = seconds => 7 * wave(seconds, 4.6, -.4) + 1.3 * wave(seconds, 1.7);
const acceleration = (seconds, amplitude, period, phase = 0) =>
  -amplitude * (Math.PI * 2 / period) ** 2 * wave(seconds, period, phase);

// The road sweeps opposite the turn while the cabin banks into it.
export function steeringPose(degrees, intensity = 1) {
  const turn = Math.max(-1, Math.min(1, degrees / 145)) * intensity;
  return {roadShift: -turn * .035, roll: turn * 1.2, lateralLoad: turn * 900};
}

// Different timings keep suspension, steering, and instruments from moving mechanically in sync.
export function drivingPose(seconds, intensity = 1) {
  return {
    swayX: intensity * .8 * wave(seconds, 4.7),
    swayY: intensity * 1.2 * wave(seconds, 3.1, .4),
    swayAngle: intensity * .09 * wave(seconds, 5.3, .7),
    rattleX: intensity * (.8 * wave(seconds, .19) + .3 * wave(seconds, .11)),
    rattleY: intensity * (2.4 * wave(seconds, .21) + .75 * wave(seconds, .13, 1.1)),
    steering: intensity * steering(seconds),
    rpm: intensity * (8 * wave(seconds, 2.9, .2) + 1.5 * wave(seconds, .8)),
    speed: intensity * (4 * wave(seconds, 6.7, .6) + .7 * wave(seconds, 1.4))
  };
}

// Acceleration of the attachment point, in pixels/s². Steering adds the gentle lateral load
// of the car's course corrections; vertical bumps change the apparent weight on the cords.
export function drivingAcceleration(seconds, intensity = 1, rate = 1) {
  return {
    x: intensity * ((acceleration(seconds, .8, 4.7) + acceleration(seconds, .8, .19)
      + acceleration(seconds, .3, .11)) * rate ** 2 + lateralLoad(seconds) * 55),
    y: intensity * (acceleration(seconds, 1.2, 3.1, .4) + acceleration(seconds, 2.4, .21)
      + acceleration(seconds, .75, .13, 1.1)) * rate ** 2
  };
}

export const createPendulum = (angle = .04) => ({angle, velocity: 0});

export function stepPendulum(state, delta, baseAcceleration, options = {}) {
  const {length = 102, gravity = 4905, damping = 1.25} = options;
  // Small substeps keep the light trinket stable when frame times vary.
  const steps = Math.max(1, Math.ceil(delta * 240));
  const dt = delta / steps;
  let {angle, velocity} = state;
  for (let i = 0; i < steps; i++) {
    const angularAcceleration = -(gravity - baseAcceleration.y) / length * Math.sin(angle)
      - baseAcceleration.x / length * Math.cos(angle) - damping * velocity;
    velocity += angularAcceleration * dt;
    angle += velocity * dt;
  }
  return {angle, velocity};
}
