import test from 'node:test';
import assert from 'node:assert/strict';
import {ignitionPose,keyringRotation,KEY_EYELET_RADIUS} from '../ignition-motion.js';
import {createPendulum,stepPendulum} from '../motion.js';

test('the inserted key makes a full quarter turn and holds the switched position',()=>{
  assert.equal(ignitionPose(0).degrees,0);
  assert.ok(ignitionPose(.38).degrees>40&&ignitionPose(.38).degrees<50);
  assert.equal(ignitionPose(.76).degrees,90);
  assert.equal(ignitionPose(5).degrees,90);
  for(const time of [0,.1,.38,.6,.76,2]){
    const {attachment}=ignitionPose(time);
    assert.ok(Math.abs(Math.hypot(attachment.x,attachment.y)-KEY_EYELET_RADIUS)<1e-9);
  }
  assert.deepEqual(ignitionPose(2).acceleration,{x:0,y:-0});
});

test('a freely hanging ring remains downward as its parent key rotates',()=>{
  for(const time of [0,.1,.38,.6,.76,2]){
    const pose=ignitionPose(time);
    const worldRotation=pose.degrees+keyringRotation(pose.degrees,0);
    assert.equal(worldRotation,0);
  }
});

test('the ring lags opposite the moving attachment and settles after ignition',()=>{
  for(const fps of [30,60,120]){
    let ring=createPendulum(0),peak=0,lagged=false;
    for(let frame=0;frame<fps*5;frame++){
      const time=frame/fps,pose=ignitionPose(time);
      ring=stepPendulum(ring,1/fps,pose.acceleration,{length:76,gravity:1600,damping:3.4});
      peak=Math.max(peak,Math.abs(ring.angle));
      if(time<.3&&ring.angle>.02)lagged=true;
      assert.ok(Number.isFinite(ring.angle));
    }
    assert.ok(lagged,`ring trails leftward eyelet motion at ${fps}fps`);
    assert.ok(peak>.05&&peak<.8);
    assert.ok(Math.abs(ring.angle)<.002);
  }
});
