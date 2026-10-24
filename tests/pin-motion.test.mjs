import test from 'node:test';
import assert from 'node:assert/strict';
import {createPinMotion,stepPinMotion,pinPlacements} from '../src/animations/pin-motion.js';
import {drivingAcceleration} from '../src/driving/motion.js';

test('loose pins shift independently under road bumps and stay within the tray scatter',()=>{
  for(const fps of [30,60,120]){
    const states=pinPlacements.map(createPinMotion);
    let peak=0;
    for(let frame=0;frame<fps*12;frame++){
      const acceleration=drivingAcceleration(frame/fps*1.4,1,1.4);
      states.forEach((state,index)=>{
        const next=stepPinMotion(state,1/fps,acceleration,index);
        assert.ok(Object.values(next).every(Number.isFinite));
        assert.ok(Math.abs(next.x)<=5&&Math.abs(next.y)<=3&&Math.abs(next.angle)<=8);
        peak=Math.max(peak,Math.abs(next.x));states[index]=next;
      });
    }
    assert.ok(peak>1,`visible movement at ${fps}fps`);
    assert.notDeepEqual(states[0],states[1]);
  }
});

test('friction settles a pin where it lands instead of pulling it back to a grid',()=>{
  let state={...createPinMotion(),x:2,y:-1,angle:3,vx:5,vy:-2,spin:3};
  for(let frame=0;frame<180;frame++)state=stepPinMotion(state,1/60,{x:0,y:0},2);
  assert.equal(state.vx,0);assert.equal(state.vy,0);assert.equal(state.spin,0);
  assert.ok(state.x>2&&state.y<-1&&state.angle>3);
  assert.deepEqual(stepPinMotion(state,1/60,{x:0,y:0},2),state);
});
