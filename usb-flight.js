// Keep the visible USB body centered when changing scale around its lanyard pivot.
const BODY_RADIUS=102.5;
const mix=(a,b,t)=>a+(b-a)*t;
const center=pose=>({x:pose.x-BODY_RADIUS*pose.scale*Math.sin(pose.angle*Math.PI/180),y:pose.y+BODY_RADIUS*pose.scale*Math.cos(pose.angle*Math.PI/180)});
const atCenter=(point,angle,scale)=>({x:point.x+BODY_RADIUS*scale*Math.sin(angle*Math.PI/180),y:point.y-BODY_RADIUS*scale*Math.cos(angle*Math.PI/180),angle,scale});
export const usbTransform=pose=>`translate(${pose.x}px,${pose.y}px) rotate(${pose.angle}deg) scale(${pose.scale})`;

export function usbFlightFrames(start,end,{popScale=1.75,arc=80}={}) {
  const a=center(start),b=center(end);
  const c1={x:a.x-arc*1.5,y:a.y-65},c2={x:b.x,y:b.y+130};
  const peak=.22,power=(1-peak)/peak,normal=peak*(1-peak)**power;
  const lift=Math.max(0,popScale-mix(start.scale,end.scale,peak));
  return Array.from({length:81},(_,i)=>{
    const t=i/80;
    // Let the forward pop register first, with a slow drift rather than a frozen hold.
    const u=t*t/(t*t+(1-t)*(1-t)),s=1-u;
    const point={x:s**3*a.x+3*s*s*u*c1.x+3*s*u*u*c2.x+u**3*b.x,y:s**3*a.y+3*s*s*u*c1.y+3*s*u*u*c2.y+u**3*b.y};
    const angle=mix(start.angle,end.angle,u*u*(3-2*u));
    const scale=mix(start.scale,end.scale,t)+lift*t*(1-t)**power/normal;
    const pose=i===0?start:i===80?end:atCenter(point,angle,scale);
    return {offset:t,transform:usbTransform(pose),easing:'linear'};
  });
}
