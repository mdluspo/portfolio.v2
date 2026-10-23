const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const CRASH_TIMING={impact:.5,fadeOut:1.5,reset:1.85,done:2.45};
export const STEERING_LIMIT=125;
export const shouldCrash=({steering,heldFor,travel})=>Math.abs(steering)>=STEERING_LIMIT&&heldFor>=.9&&travel>=240;

export function wheelContains(point,rect){
  if(!rect.width||!rect.height)return false;
  const x=(point.x-rect.left-rect.width/2)/(rect.width*.48);
  const y=(point.y-rect.top-rect.height/2)/(rect.height*.48);
  return x*x+y*y<=1;
}

export function wheelScrollTurn(point,rect,dx,dy){
  const x=(point.x-rect.left-rect.width/2)/(rect.width/2);
  const y=(point.y-rect.top-rect.height/2)/(rect.height/2);
  const torque=x*dy-y*dx;
  const direction=Math.sign(Math.abs(torque)>2?torque:dy||dx);
  return direction*Math.min(120,Math.hypot(dx,dy))*.5;
}

export const createCrash=(steering)=>({elapsed:0,direction:Math.sign(steering)||1,steering:Math.max(105,Math.min(145,Math.abs(steering)*1.8))});
export const advanceCrash=(state,delta)=>({...state,elapsed:Math.min(CRASH_TIMING.done,state.elapsed+Math.max(0,delta))});

export function crashPose(state){
  const {elapsed:t,direction:d}=state,T=CRASH_TIMING;
  const phase=t<T.impact?'swerve':t<T.fadeOut?'impact':t<T.reset?'fade-out':t<T.done?'fade-in':'done';
  const fresh=t>=T.reset;
  const s=smooth(t/T.impact),hit=Math.max(0,t-T.impact);
  const shock=t>=T.impact&&!fresh?Math.exp(-4.8*hit):0;
  const kick=t>=T.impact&&!fresh?Math.exp(-13*hit)+.8*Math.exp(-(((hit-.12)/.035)**2)):0;
  const fade=t<T.fadeOut?0:t<T.reset?smooth((t-T.fadeOut)/(T.reset-T.fadeOut)):1-smooth((t-T.reset)/(T.done-T.reset));
  return {
    phase,fresh,fade:clamp(fade,0,1),impactTime:hit,
    steering:fresh?0:d*state.steering*s,
    roadShift:fresh?0:-d*.15*s,
    roll:fresh?0:d*(8*s+Math.sin(hit*32)*shock*16),
    shakeX:fresh?0:Math.sin(hit*83)*shock*92-d*kick*58,
    shakeY:fresh?0:-Math.cos(hit*73)*shock*78-kick*64,
    zoom:1+kick*.26,
    wheelKick:Math.sin(hit*41)*shock*48,
    treeProgress:fresh?0:s,
    treeVisible:!fresh,
    struck:t>=T.impact&&!fresh,
    stopped:t>=T.impact&&!fresh
  };
}
