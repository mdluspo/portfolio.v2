import test from 'node:test';
import assert from 'node:assert/strict';
import {drivingPose,steeringPose} from '../motion.js';
import {createPendulum,stepPendulum,drivingAcceleration} from '../motion.js';

test('steering turns the view and cabin in both directions and returns to neutral',()=>{
  assert.ok(Object.values(steeringPose(0)).every(value=>value===0));
  const right=steeringPose(60),left=steeringPose(-60);
  assert.ok(right.roadShift<0&&right.roll>0&&right.lateralLoad>0);
  for(const key of Object.keys(right))assert.equal(left[key],-right[key]);
  assert.ok(Math.abs(steeringPose(120).roadShift)>Math.abs(right.roadShift));
  assert.deepEqual(steeringPose(200),steeringPose(145));
  for(const key of Object.keys(right))assert.ok(Math.abs(steeringPose(60,.2)[key]-right[key]*.2)<1e-10);
});

test('steering makes visible small corrections to both sides without a full turn',()=>{
  const angles=Array.from({length:1200},(_,i)=>drivingPose(i/60).steering);
  assert.ok(Math.max(...angles)>16);
  assert.ok(Math.min(...angles)<-16);
  assert.ok(angles.every(angle=>Math.abs(angle)<=19));
});

test('road rattle is stronger but stays within a few pixels',()=>{
  const samples=Array.from({length:121},(_,i)=>drivingPose(i/120).rattleY);
  const crossings=samples.slice(1).filter((value,i)=>value*samples[i]<0).length;
  assert.ok(crossings>=8);
  assert.ok(samples.every(value=>Math.abs(value)<=3.2));
  assert.ok(Math.max(...samples.map(Math.abs))>2.8);
});

test('tachometer and speedometer drift independently around their driving readings',()=>{
  const poses=Array.from({length:600},(_,i)=>drivingPose(i/60));
  for(const key of ['rpm','speed']){
    assert.ok(poses.some(pose=>pose[key]>3));
    assert.ok(poses.some(pose=>pose[key]<-3));
  }
  assert.ok(poses.some(pose=>Math.sign(pose.rpm)!==Math.sign(pose.speed)));
});

test('motion is continuous and reduces proportionally for reduced-motion preferences',()=>{
  for(let t=0;t<10;t+=.1){
    const pose=drivingPose(t),next=drivingPose(t+1/120),gentle=drivingPose(t,.2);
    for(const key of Object.keys(pose)){
      assert.ok(Number.isFinite(pose[key]));
      assert.ok(Math.abs(gentle[key]-pose[key]*.2)<1e-10);
    }
    assert.ok(Math.abs(next.steering-pose.steering)<.3);
  }
});

test('USB lags opposite the car acceleration and keeps momentum after a bump',()=>{
  const rest=createPendulum(0);
  const pushed=stepPendulum(rest,1/60,{x:500,y:0});
  assert.ok(pushed.angle<0);
  assert.ok(pushed.velocity<0);
  const released=stepPendulum(pushed,1/60,{x:0,y:0});
  assert.ok(released.angle<pushed.angle);
  assert.equal(rest.angle,0);
});

test('USB swing damps naturally when the car stops disturbing its attachment',()=>{
  let state=createPendulum(.12);
  for(let i=0;i<600;i++)state=stepPendulum(state,1/60,{x:0,y:0});
  assert.ok(Math.abs(state.angle)<.001);
  assert.ok(Math.abs(state.velocity)<.001);
});

test('road bumps continually excite the USB without unstable or excessive swings',()=>{
  for(const fps of [30,60,120]){
    let state=createPendulum(0),maximum=0;
    for(let i=0;i<fps*20;i++){
      state=stepPendulum(state,1/fps,drivingAcceleration(i/fps));
      assert.ok(Number.isFinite(state.angle)&&Number.isFinite(state.velocity));
      if(i>fps*5)maximum=Math.max(maximum,Math.abs(state.angle));
    }
    assert.ok(maximum>.08,`visible swing at ${fps}fps`);
    assert.ok(maximum<.3,`restrained swing at ${fps}fps`);
  }
});
