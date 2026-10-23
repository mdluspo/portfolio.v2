import test from 'node:test';
import assert from 'node:assert/strict';
import {createDrive,accelerate,accelerateSteering,advanceDrive,depthAt,rearDepthAt,CRUISE_SPEED,MAX_SPEED,STEERING_MAX_SPEED} from '../drive.js';

test('spinning the rim surges immediately beyond normal scroll speed and then settles',()=>{
  assert.deepEqual(accelerateSteering(createDrive(),60),accelerateSteering(createDrive(),-60));
  let state={...createDrive(),distance:7};
  for(let notch=0;notch<4;notch++){
    const previous=state;
    state=accelerateSteering(state,60);
    assert.ok(state.speed>previous.speed);
    assert.equal(state.distance,previous.distance);
    for(let i=0;i<15;i++)state=advanceDrive(state,1/60);
  }
  assert.ok(state.speed>MAX_SPEED*1.5);
  assert.ok(state.speed<=STEERING_MAX_SPEED);
  for(let i=0;i<1800;i++)state=advanceDrive(state,1/60);
  assert.ok(Math.abs(state.speed-CRUISE_SPEED)<.001);
});

test('the car continuously moves forward without scrolling',()=>{
  let state=createDrive();
  for(let i=0;i<600;i++)state=advanceDrive(state,1/60);
  assert.equal(state.speed,CRUISE_SPEED);
  assert.ok(Math.abs(state.distance-10*CRUISE_SPEED)<1e-8);
  assert.ok(state.distance>=30);
});

test('scrolling accelerates smoothly and speed eases back to cruise',()=>{
  let state=accelerate(createDrive(),180);
  assert.equal(state.speed,CRUISE_SPEED);
  for(let i=0;i<30;i++)state=advanceDrive(state,1/60);
  assert.ok(state.speed>CRUISE_SPEED*2.5);
  const distance=state.distance;
  for(let i=0;i<1200;i++)state=advanceDrive(state,1/60);
  assert.ok(state.distance>distance);
  assert.ok(Math.abs(state.speed-CRUISE_SPEED)<.001);
});

test('both wheel directions boost forward motion and repeated scrolling is capped',()=>{
  assert.deepEqual(accelerate(createDrive(),120),accelerate(createDrive(),-120));
  let state=createDrive();
  for(let i=0;i<300;i++){
    state=advanceDrive(accelerate(state,1000),1/60);
    assert.ok(state.speed<=MAX_SPEED&&state.speed>=CRUISE_SPEED);
  }
});

test('scroll changes speed without resetting the scenery travel phase',()=>{
  let state={...createDrive(),distance:17.31};
  const boosted=accelerate(state,200);
  assert.equal(boosted.distance,state.distance);
  assert.equal(depthAt(boosted.distance),depthAt(state.distance));
  state=advanceDrive(boosted,1/60);
  assert.ok(state.distance>boosted.distance);
  assert.ok(state.distance-boosted.distance<MAX_SPEED/60);
});

test('perspective loops meet at the horizon and pass the dashboard before recycling',()=>{
  for(const offset of [0,.1,.37,.8]){
    assert.ok(Math.abs(depthAt(2,offset)-depthAt(6,offset))<1e-10);
  }
  assert.ok(depthAt(3.999)>.99);
  assert.equal(depthAt(4),0);
  assert.ok(depthAt(4.001)<1e-8);
  assert.ok(.48+.5*depthAt(3.999)>.97);
});

test('rearview markings shrink toward the horizon and stay synchronized with travel',()=>{
  assert.ok(rearDepthAt(1) > rearDepthAt(2));
  assert.ok(rearDepthAt(3.599)<1e-8);
  assert.ok(rearDepthAt(3.601)>.99);
  assert.ok(Math.abs(rearDepthAt(1,.2)-rearDepthAt(4.6,.2))<1e-10);
});

test('a short scroll burst reaches a much faster pace than cruise',()=>{
  let state=createDrive();
  for(let i=0;i<12;i++)state=advanceDrive(accelerate(state,120),1/60);
  for(let i=0;i<24;i++)state=advanceDrive(state,1/60);
  assert.ok(state.speed>CRUISE_SPEED*4);
  assert.ok(state.speed<=MAX_SPEED);
});

test('ordinary scrolling preserves a stronger steering surge instead of slowing it down',()=>{
  let state=createDrive();
  for(let i=0;i<3;i++)state=accelerateSteering(state,60);
  assert.ok(state.boost>MAX_SPEED-CRUISE_SPEED);
  const scrolling=accelerate(state,120);
  assert.equal(scrolling.speed,state.speed);
  assert.equal(scrolling.boost,state.boost);
  assert.equal(scrolling.distance,state.distance);
});

test('steering builds much more speed than normal scrolling before the crash threshold',()=>{
  let scrolling=createDrive(),steering=createDrive();
  for(let notch=0;notch<4;notch++){
    scrolling=accelerate(scrolling,120);steering=accelerateSteering(steering,60);
    for(let frame=0;frame<12;frame++){
      scrolling=advanceDrive(scrolling,1/60);steering=advanceDrive(steering,1/60);
    }
  }
  assert.ok(scrolling.speed>14);
  assert.ok(steering.speed>30);
  assert.ok(steering.speed>scrolling.speed*1.8);
});
