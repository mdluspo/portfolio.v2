import test from 'node:test';
import assert from 'node:assert/strict';
import {layout,bounds,constrain,edgeIntent,lookTarget,ease,advance,panStep,ART_WIDTH,ART_HEIGHT} from '../src/driving/camera.js';
import {PAINTED_EXTENSION,headlinerBottom} from '../src/driving/camera.js';

test('center is calm and entering an edge zone selects a full direction',()=>{
  for(const x of [180,200,280,400,500,600,720,800,820]) assert.equal(edgeIntent(x,1000),0);
  assert.equal(edgeIntent(0,1000),-1);
  assert.ok(Math.abs(edgeIntent(1000,1000)-1)<1e-10);
  assert.equal(edgeIntent(179,1000),-1);
  assert.equal(edgeIntent(821,1000),1);
  assert.equal(edgeIntent(-200,1000),-1);
  assert.equal(edgeIntent(1200,1000),1);
});

test('moving the pointer to an edge turns the camera without a drag',()=>{
  const viewport={width:1440,height:900},size=layout(viewport.width,viewport.height);
  const limits=bounds(viewport.width,viewport.height,size.width,size.height);
  const current={x:0,y:limits.home};
  const left=lookTarget({x:0,y:450},viewport,current,limits);
  const right=lookTarget({x:1440,y:450},viewport,current,limits);
  assert.equal(left.x,limits.right);
  assert.ok(Math.abs(right.x-limits.left)<1e-9);
  assert.ok(lookTarget({x:720,y:0},viewport,current,limits).y>current.y);
  assert.ok(lookTarget({x:720,y:900},viewport,current,limits).y<current.y);
  assert.deepEqual(lookTarget({x:720,y:450},viewport,left,limits),left);
});

test('ordinary pointer movement stays still and looking down requires reaching the bottom edge zone',()=>{
  const viewport={width:1440,height:900},size=layout(viewport.width,viewport.height);
  const limits=bounds(viewport.width,viewport.height,size.width,size.height);
  const current={x:0,y:limits.home};
  for(const x of [.18,.25,.5,.75,.82]){
    for(const y of [.18,.25,.5,.55,.7,.8,.82]){
      assert.deepEqual(lookTarget({x:viewport.width*x,y:viewport.height*y},viewport,current,limits),current);
    }
  }
  const nearEdge=lookTarget({x:720,y:viewport.height*.9},viewport,current,limits);
  const farther=lookTarget({x:720,y:viewport.height*.96},viewport,current,limits);
  const full=lookTarget({x:720,y:viewport.height},viewport,current,limits);
  assert.equal(nearEdge.y,limits.top);
  assert.equal(farther.y,limits.top);
  assert.equal(full.y,limits.top);
  const shifted={x:limits.right/2,y:(limits.home+limits.top)/2};
  assert.deepEqual(lookTarget({x:720,y:450},viewport,shifted,limits),shifted);
});

test('all four trigger zones aim at the end and the center holds the current view',()=>{
  const viewport={width:1440,height:900},size=layout(viewport.width,viewport.height);
  const limits=bounds(viewport.width,viewport.height,size.width,size.height);
  let target={x:0,y:limits.home};
  for(const [pointer,expected] of [
    [{x:720,y:800},{x:0,y:limits.top}],
    [{x:1400,y:450},{x:limits.left,y:limits.top}],
    [{x:720,y:100},{x:limits.left,y:limits.bottom}],
    [{x:40,y:450},{x:limits.right,y:limits.bottom}],
    [{x:1400,y:800},{x:limits.left,y:limits.top}],
  ]){
    target=lookTarget(pointer,viewport,target,limits);
    assert.deepEqual(target,expected);
    target=lookTarget({x:720,y:450},viewport,target,limits);
    assert.deepEqual(target,expected);
  }
});

test('edge navigation selects the full destination and holds when leaving a zone',()=>{
  const viewport={width:1440,height:900},size=layout(viewport.width,viewport.height);
  const limits=bounds(viewport.width,viewport.height,size.width,size.height);
  for(const pointer of [{x:0,y:450},{x:1440,y:450},{x:720,y:0},{x:720,y:900}]){
    let camera={x:0,y:limits.home};
    const destination=lookTarget(pointer,viewport,camera,limits);
    camera=lookTarget(pointer,viewport,camera,limits);
    assert.deepEqual(camera,destination);
    const stopped={...camera};
    for(let frame=0;frame<30;frame++){
      camera=lookTarget({x:720,y:450},viewport,camera,limits);
      assert.deepEqual(camera,stopped);
    }
  }
});

test('smooth pans arrive in 280ms at every distance and stop or reverse on a new command',()=>{
  for(const fps of [30,60,120]){
    for(const destination of [-5000,-100,100,5000]){
      let position=0,state=null;
      for(let frame=0;frame<Math.ceil(fps*.28);frame++){
        state=panStep(position,destination,1/fps,state);
        assert.ok(Math.abs(destination-state.position)<=Math.abs(destination-position));
        assert.ok(Math.abs(state.position)<=Math.abs(destination));
        position=state.position;
      }
      assert.equal(position,destination);
    }
  }
  const moving=panStep(0,500,1/60);
  assert.ok(moving.position>0&&moving.position<500);
  const stopped=panStep(moving.position,moving.position,1/60,moving);
  assert.equal(stopped.position,moving.position);
  const reversed=panStep(moving.position,-500,1/60,moving);
  assert.ok(reversed.position<moving.position&&reversed.position>-500);
});

test('pan starts and finishes gently rather than jumping on its first or last frame',()=>{
  let position=0,state=null;
  const steps=[];
  for(let frame=0;frame<28;frame++){
    state=panStep(position,1000,.28/28,state);
    steps.push(state.position-position);
    position=state.position;
  }
  assert.ok(steps[0]>0&&steps[0]<3);
  assert.ok(steps[0]<steps[4]&&steps[4]<steps[9]);
  assert.ok(steps[23]<steps[18]&&steps[18]<steps[9]);
  assert.ok(steps[27]<.1);
  assert.equal(position,1000);
});

test('pan reserves its final portion for a gradual slowdown',()=>{
  const middle=panStep(0,1000,.14);
  const late=panStep(middle.position,1000,.10,middle);
  const almost=panStep(late.position,1000,.03,late);
  const end=panStep(almost.position,1000,.011,almost);
  assert.ok(middle.position>700);
  assert.ok(late.position>990&&late.position<1000);
  assert.ok(almost.position>999.9&&almost.position<1000);
  assert.equal(end.position,1000);
});

test('upward looking stays close to the opening view beneath the headliner',()=>{
  for(const [vw,vh] of [[390,844],[1440,900],[1920,1080],[2560,1080]]){
    const {width,height}=layout(vw,vh),limits=bounds(vw,vh,width,height);
    assert.ok(limits.bottom-limits.home<=8+1e-9);
    const up=lookTarget({x:vw/2,y:0},{width:vw,height:vh},{x:0,y:limits.home},limits);
    assert.equal(up.y,limits.bottom);
    const roofBottom=headlinerBottom(height,vh,limits.home);
    // Even at the sides, the ceiling extends into view rather than ending above the frame.
    const roofEdge=-height*.1+(height*.1+roofBottom)*(154/180);
    const screenY=vh/2-height/2+up.y+roofEdge;
    assert.ok(screenY>50,`roof covers the top in ${vw}x${vh}`);
  }
});

test('downward view reveals the radio and glovebox but never goes beyond the painted car',()=>{
  for(const [vw,vh] of [[320,740],[390,844],[768,1024],[1440,900],[1920,1080],[2560,1080]]){
    const {width,height}=layout(vw,vh),limits=bounds(vw,vh,width,height);
    assert.ok(Math.abs(width/height-ART_WIDTH/ART_HEIGHT)<1e-10);
    const originalMargin=(height-vh)/2-8;
    assert.ok(Math.abs(limits.top+originalMargin+height*PAINTED_EXTENSION)<1e-8);
    assert.ok(limits.top<=limits.home&&limits.home<=limits.bottom);
    // The socket and downward-facing USB body fit within the deeper console view.
    const portY=vh/2+limits.top+(1.016-.5)*height;
    assert.ok(portY+60<vh,`USB below the radio is visible in ${vw}x${vh}`);
    assert.ok(PAINTED_EXTENSION>.12&&PAINTED_EXTENSION<.142);
    for(const x of [limits.left,limits.right]){
      assert.ok(vw/2-width/2+x<=-11.99);
      assert.ok(vw/2+width/2+x>=vw+11.99);
    }
    for(const y of [limits.top,limits.bottom]){
      assert.ok(vh/2-height/2+y<=-7.99,`top coverage in ${vw}x${vh}`);
      assert.ok(vh/2+height*(.5+PAINTED_EXTENSION)+y>=vh+7.99,`bottom coverage in ${vw}x${vh}`);
    }
    const screenY=normalized=>vh/2+limits.top+(normalized-.5)*height;
    assert.ok(screenY(.855)>0&&screenY(.972)<vh-35,`full radio screen visible in ${vw}x${vh}`);
    assert.ok(screenY(.89)>0&&screenY(1.04)<vh,`glovebox and lowered lid visible in ${vw}x${vh}`);
    assert.deepEqual(constrain({x:1e6,y:-1e6},limits),{x:limits.right,y:limits.top});
  }
});

test('camera settles without overshooting or jumping more than the speed limit',()=>{
  let position=0;
  for(let i=0;i<600;i++){
    const next=advance(position,600,1/60);
    assert.ok(next>=position&&next<=600);
    assert.ok(next-position<=230/60+1e-9);
    position=next;
  }
  assert.ok(Math.abs(position-600)<.001);
  assert.ok(advance(600,-600,1/60)<600);
});

test('easing is consistent at different frame rates',()=>{
  const results=[30,60,120].map(fps=>{
    let position=0;for(let i=0;i<fps;i++)position=ease(position,100,4.8,1/fps);
    return position;
  });
  assert.ok(Math.abs(results[0]-results[1])<1e-9);
  assert.ok(Math.abs(results[1]-results[2])<1e-9);
});
