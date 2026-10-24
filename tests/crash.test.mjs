import test from 'node:test';
import assert from 'node:assert/strict';
import {wheelContains,wheelScrollTurn,createCrash,advanceCrash,crashPose,CRASH_TIMING,shouldCrash} from '../src/driving/crash.js';

const rect={left:0,top:0,width:400,height:400};
test('only the steering wheel area triggers the Easter egg',()=>{
 assert.ok(wheelContains({x:300,y:200},rect));
 assert.ok(!wheelContains({x:0,y:0},rect));
 assert.ok(!wheelContains({x:450,y:200},rect));
});
test('scroll direction and the side of the rim determine the turn',()=>{
 const right={x:350,y:200},left={x:50,y:200};
 assert.ok(wheelScrollTurn(right,rect,0,120)>0);
 assert.ok(wheelScrollTurn(right,rect,0,-120)<0);
 assert.ok(wheelScrollTurn(left,rect,0,120)<0);
 assert.ok(wheelScrollTurn(left,rect,0,-120)>0);
});
test('a crash requires sustained scrolling rather than a single notch or quick burst',()=>{
 assert.equal(shouldCrash({steering:60,heldFor:.1,travel:60}),false);
 assert.equal(shouldCrash({steering:145,heldFor:.3,travel:300}),false);
 assert.equal(shouldCrash({steering:80,heldFor:1.2,travel:300}),false);
 assert.equal(shouldCrash({steering:145,heldFor:1.1,travel:300}),true);
});
test('the impact has a forceful initial jolt and zoom that clears on the fresh car',()=>{
 const state=createCrash(140);
 const impact=crashPose({...state,elapsed:CRASH_TIMING.impact});
 assert.ok(CRASH_TIMING.impact<=.5);
 assert.ok(impact.shakeY < -140);
 assert.ok(impact.zoom > 1.25);
 const recoil=crashPose({...state,elapsed:CRASH_TIMING.impact+.12});
 assert.ok(recoil.zoom>1.25);
 const fresh=crashPose({...state,elapsed:CRASH_TIMING.reset});
 assert.equal(fresh.zoom,1);assert.equal(fresh.shakeX,0);assert.equal(fresh.shakeY,0);
});
test('crash holds the impact for a second, resets under black, then reveals a clean car',()=>{
 for(const direction of [-1,1]){
  let state=createCrash(direction*60),resetAt=null;
  for(let i=0;i<400;i++){
   state=advanceCrash(state,1/120);const pose=crashPose(state);
   assert.ok(Object.values(pose).filter(v=>typeof v==='number').every(Number.isFinite));
   assert.ok(pose.fade>=0&&pose.fade<=1);
   if(pose.fresh&&resetAt===null){resetAt=state.elapsed;assert.ok(pose.fade>.999);}
   if(pose.fresh){assert.equal(pose.roll,0);assert.equal(pose.steering,0);assert.equal(pose.treeVisible,false);}
  }
  assert.equal(crashPose(state).phase,'done');
  assert.equal(crashPose(state).fade,0);
  assert.ok(Math.abs(resetAt-CRASH_TIMING.reset)<1/120+.0001);
  assert.equal(CRASH_TIMING.fadeOut-CRASH_TIMING.impact,1);
 }
});
