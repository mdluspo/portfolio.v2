import test from 'node:test';
import assert from 'node:assert/strict';
import {clearWorkspaceAnimations,pageTurnFrames,pageTurnDuration} from '../src/animations/dialog-motion.js';

test('fast scrolling speeds up page turns while isolated small ticks retain a readable turn',()=>{
  const normal=pageTurnDuration(50,300);
  assert.ok(pageTurnDuration(50,30)<normal);
  assert.ok(pageTurnDuration(250,300)<normal);
  assert.equal(pageTurnDuration(-250,300),pageTurnDuration(250,300));
  assert.ok(pageTurnDuration(10000,1)>=160);
});

test('returning to a workspace clears old filled fade-outs as well as active transitions',()=>{
  const animations=[
    {playState:'finished',opacity:0,cancel(){this.playState='idle';this.opacity=null;}},
    {playState:'running',opacity:.4,cancel(){this.playState='idle';this.opacity=null;}}
  ];
  const projects={getAnimations:()=>[animations[0]]};
  const binder={getAnimations:()=>[animations[1]]};
  clearWorkspaceAnimations(projects,binder);
  assert.ok(animations.every(animation=>animation.playState==='idle'&&animation.opacity===null));
  clearWorkspaceAnimations({getAnimations:()=>[]});
});

test('one two-sided sheet makes a continuous half turn in either direction',()=>{
  const forward=pageTurnFrames(1),back=pageTurnFrames(-1);
  assert.ok(forward.at(-1).transform.includes('rotateY(-180deg)'));
  assert.ok(back.at(-1).transform.includes('rotateY(180deg)'));
  assert.ok(forward[1].transform.includes('rotateY(-90deg)'));
  assert.ok(back[1].transform.includes('rotateY(90deg)'));
  for(const turn of [forward,back]){
    assert.ok(turn.every(frame=>!('opacity' in frame)&&!('filter' in frame)));
    assert.equal(turn[0].transform,'translate3d(0px,0px,1px) rotateY(0deg)');
  }
  assert.ok(pageTurnFrames(1,-36,0).at(-1).transform.includes('translate3d(-36px,0px,1px)'));
});
