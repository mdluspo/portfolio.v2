const QUARTER_TURN=Math.PI/2;
export const KEY_EYELET_RADIUS=32.2;
export const keyringRotation = (keyDegrees,ringAngle) => -keyDegrees-ringAngle*180/Math.PI;

// The key turns about the lock; the eyelet describes an arc and accelerates the ring.
export function ignitionPose(seconds,duration=.76) {
  const u=Math.max(0,Math.min(1,seconds/duration));
  const angle=QUARTER_TURN*(10*u**3-15*u**4+6*u**5);
  const velocity=QUARTER_TURN*(30*u**2-60*u**3+30*u**4)/duration;
  const acceleration=QUARTER_TURN*(60*u-180*u**2+120*u**3)/duration**2;
  const r=KEY_EYELET_RADIUS;
  return {
    angle, degrees:angle*180/Math.PI,
    attachment:{x:-r*Math.sin(angle),y:r*Math.cos(angle)},
    acceleration:{
      x:r*(Math.sin(angle)*velocity**2-Math.cos(angle)*acceleration),
      y:-r*(Math.cos(angle)*velocity**2+Math.sin(angle)*acceleration)
    }
  };
}
