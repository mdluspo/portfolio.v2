import test from 'node:test';
import assert from 'node:assert/strict';
import {usbFlightFrames,usbTransform} from '../src/animations/usb-flight.js';

const pose=frame=>{
 const values=[...frame.transform.matchAll(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)].map(match=>Number(match[0]));
 return {x:values[0],y:values[1],angle:values[2],scale:values[3]};
};
const center=p=>({x:p.x-102.5*p.scale*Math.sin(p.angle*Math.PI/180),y:p.y+102.5*p.scale*Math.cos(p.angle*Math.PI/180)});

test('USB enlarges and follows a continuous curve into the socket without pausing',()=>{
 const start={x:0,y:0,angle:-4,scale:1},end={x:12,y:740,angle:180,scale:.7};
 const frames=usbFlightFrames(start,end);
 assert.equal(frames[0].transform,usbTransform(start));
 assert.equal(frames.at(-1).transform,usbTransform(end));
 assert.ok(Math.max(...frames.map(frame=>pose(frame).scale))>=1.7);
 const initialCenter=center(start);
 const early=frames.filter(frame=>frame.offset<=.25).map(frame=>center(pose(frame)));
 assert.ok(early.every(point=>point.y<initialCenter.y+8),'pop registers before descending');
 for(let i=1;i<frames.length;i++)assert.notEqual(frames[i].transform,frames[i-1].transform);
 const points=frames.map(frame=>center(pose(frame)));
 for(let i=2;i<points.length;i++){
   const ax=points[i].x-2*points[i-1].x+points[i-2].x;
   const ay=points[i].y-2*points[i-1].y+points[i-2].y;
   assert.ok(Math.hypot(ax,ay)<2,'flight tangent changes smoothly');
 }
 assert.equal(pose(frames.at(-1)).angle,180);
 assert.equal(pose(frames.at(-1)).scale,.7);
});

test('returning or reversing a flight starts from its current pose',()=>{
 for(const start of [{x:10,y:700,angle:180,scale:.7},{x:-62,y:310,angle:83,scale:1.4}]){
  const end={x:0,y:0,angle:0,scale:1};
  const frames=usbFlightFrames(start,end);
  assert.equal(frames[0].transform,usbTransform(start));
  assert.equal(frames.at(-1).transform,usbTransform(end));
  assert.ok(frames.every(frame=>Object.values(pose(frame)).every(Number.isFinite)));
 }
});

test('reduced-motion flight still contains a visible lift and destination cue',()=>{
 const frames=usbFlightFrames({x:0,y:0,angle:0,scale:1},{x:0,y:700,angle:180,scale:.7},{popScale:1.25,arc:20});
 assert.ok(Math.max(...frames.map(frame=>pose(frame).scale))>=1.2);
 for(let i=1;i<frames.length;i++)assert.notEqual(frames[i].transform,frames[i-1].transform);
});
