import test from 'node:test';
import assert from 'node:assert/strict';
import {layout,bounds,constrain,edgeIntent,lookTarget,ease,advance,ART_WIDTH,ART_HEIGHT} from '../camera.js';
import {PAINTED_EXTENSION,headlinerBottom} from '../camera.js';

test('center is calm and edge zones have a progressive response',()=>{
  for(const x of [280,400,500,600,720]) assert.equal(edgeIntent(x,1000),0);
  assert.equal(edgeIntent(0,1000),-1);
  assert.ok(Math.abs(edgeIntent(1000,1000)-1)<1e-10);
  assert.ok(Math.abs(edgeIntent(250,1000))<Math.abs(edgeIntent(100,1000)));
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

test('looking down begins in the lower half and reaches the full view before the bottom edge',()=>{
  const viewport={width:1440,height:900},size=layout(viewport.width,viewport.height);
  const limits=bounds(viewport.width,viewport.height,size.width,size.height);
  const current={x:0,y:limits.home};
  const center=lookTarget({x:720,y:viewport.height*.5},viewport,current,limits);
  const lowerHalf=lookTarget({x:720,y:viewport.height*.55},viewport,current,limits);
  const full=lookTarget({x:720,y:viewport.height*.71},viewport,current,limits);
  assert.equal(center.y,current.y);
  assert.ok(lowerHalf.y<current.y);
  assert.ok((current.y-lowerHalf.y)/(current.y-limits.top)>.35);
  assert.equal(full.y,limits.top);
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
