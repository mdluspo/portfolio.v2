// Short friction-limited slides and knocks keep loose pins from moving as one rigid panel.
export const pinPlacements = [
  [8,25,-24,.96], [24,16,16,1.06], [40,32,-13,.93], [57,15,29,1],
  [72,35,-21,1.08], [90,23,12,.94], [14,75,31,1.02],
  [31,67,-34,.97], [47,82,17,1.04], [59,57,-16,.94],
  [77,81,24,1], [91,65,-29,.93], [7,53,10,.92], [49,48,-38,.96]
];
export const createPinMotion = () => ({x:0,y:0,angle:0,vx:0,vy:0,spin:0});

function slide(position,velocity,force,friction,limit,dt) {
  if(Math.abs(velocity)<.02&&Math.abs(force)<=friction) return [position,0];
  const direction=Math.sign(velocity||force);
  let next=velocity+(force-direction*friction-velocity*3)*dt;
  if(next*velocity<0&&Math.abs(force)<=friction)next=0;
  position+=next*dt;
  if(Math.abs(position)>limit){position=Math.sign(position)*limit;next*=-.16;}
  return [position,next];
}

export function stepPinMotion(state,delta,acceleration,index) {
  const steps=Math.max(1,Math.ceil(delta*240)),dt=delta/steps;
  const mobility=.7+(index%5)*.17,friction=12+(index%4)*3;
  const direction=index%2?1:-1;
  const fx=-acceleration.x*.055*mobility;
  const fy=acceleration.y*.014*mobility*direction;
  const torque=(fx*.35*direction+fy*.22)*(1+(index%3)*.15);
  const result={...state};
  for(let i=0;i<steps;i++){
    [result.x,result.vx]=slide(result.x,result.vx,fx,friction,5,dt);
    [result.y,result.vy]=slide(result.y,result.vy,fy,friction,3,dt);
    [result.angle,result.spin]=slide(result.angle,result.spin,torque,4,8,dt);
  }
  return result;
}
