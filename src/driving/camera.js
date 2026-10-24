export const ART_WIDTH = 1672;
export const ART_HEIGHT = 941;
export const PAINTED_EXTENSION = .135;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function layout(viewWidth, viewHeight) {
  const width = Math.max(viewWidth, viewHeight * ART_WIDTH / ART_HEIGHT) * 1.1;
  return { width, height: width * ART_HEIGHT / ART_WIDTH };
}
export function bounds(viewWidth, viewHeight, width, height) {
  // Use the completed lower console, retaining a margin inside the 14.2% extended painting.
  const horizontal = Math.max(0, (width - viewWidth) / 2 - 12);
  const margin = Math.max(0, (height - viewHeight) / 2 - 8);
  const home = Math.min(-Math.min(height * .03, margin * .5), -margin + Math.min(100, height * .08));
  const tilt = Math.min(8, viewHeight * .01);
  return {left: -horizontal, right: horizontal,
    top: -margin - height * PAINTED_EXTENSION, bottom: Math.min(margin, home + tilt), home};
}
export function constrain(point, limits) {
  return {x: clamp(point.x, limits.left, limits.right), y: clamp(point.y, limits.top, limits.bottom)};
}
export function headlinerBottom(height, viewHeight, home) {
  const crop = (height - viewHeight) / 2 - home;
  // Account for the curved SVG edge so the ceiling also covers wide desktop viewports.
  return (crop + 58 + height * .1) / (154 / 180) - height * .1;
}
// Edge zones select a complete view rather than tracking pointer distance.
export function edgeIntent(position, size, zone = .18) {
  if (position < size * zone) return -1;
  if (position > size * (1 - zone)) return 1;
  return 0;
}
export function lookTarget(pointer, viewport, current, limits) {
  const x = edgeIntent(pointer.x, viewport.width);
  const y = edgeIntent(pointer.y, viewport.height);
  return constrain({x: x < 0 ? limits.right : x > 0 ? limits.left : current.x,
    y: y < 0 ? limits.bottom : y > 0 ? limits.top : current.y}, limits);
}
export const ease = (current, target, speed, delta) => current + (target - current) * (1 - Math.exp(-speed * delta));
// A fixed duration keeps long pans just as quick as short ones, with no lingering tail.
export function panStep(current, target, delta, previous = null) {
  const duration = .28;
  if (current === target) return {position: target, from: target, to: target, elapsed: 0};
  const state = previous?.to === target ? previous : {from: current, to: target, elapsed: 0};
  const elapsed = Math.min(duration, state.elapsed + delta);
  const progress = elapsed / duration;
  // Reach most of the distance early, reserving more time for a soft landing.
  const shaped = 1 - Math.pow(1 - progress, 1.5);
  const smooth = shaped * shaped * shaped * (shaped * (shaped * 6 - 15) + 10);
  return {from: state.from, to: target, elapsed,
    position: elapsed >= duration ? target : state.from + (target - state.from) * smooth};
}
export function advance(current, target, delta, maxSpeed = 230, response = 4.8) {
  const step = ease(current, target, response, delta) - current;
  return current + clamp(step, -maxSpeed * delta, maxSpeed * delta);
}
