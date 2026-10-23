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
// Broad edge zones turn the view; the middle stays calm.
export function edgeIntent(position, size, zone = .28) {
  const normalized = position / size;
  if (normalized < zone) return -Math.pow(clamp((zone - normalized) / zone, 0, 1), 1.25);
  if (normalized > 1 - zone) return Math.pow(clamp((normalized - (1 - zone)) / zone, 0, 1), 1.25);
  return 0;
}
export function lookTarget(pointer, viewport, current, limits) {
  const x = edgeIntent(pointer.x, viewport.width);
  // The lower half is a broad look-down zone; no need to hunt for the bottom edge.
  const lower = Math.pow(clamp((pointer.y / viewport.height - .5) / .2, 0, 1), .7);
  const y = lower || edgeIntent(Math.min(pointer.y, viewport.height * .5), viewport.height, .22);
  return constrain({x: x ? -x * limits.right : current.x,
    y: y < 0 ? limits.home + -y * (limits.bottom - limits.home)
      : y > 0 ? limits.home - y * (limits.home - limits.top) : current.y}, limits);
}
export const ease = (current, target, speed, delta) => current + (target - current) * (1 - Math.exp(-speed * delta));
export function advance(current, target, delta, maxSpeed = 230) {
  const step = ease(current, target, 4.8, delta) - current;
  return current + clamp(step, -maxSpeed * delta, maxSpeed * delta);
}
