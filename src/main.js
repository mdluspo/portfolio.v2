import {layout, bounds, constrain, lookTarget, ease, panStep} from './driving/camera.js';

import {drivingPose, drivingAcceleration, steeringPose, createPendulum, stepPendulum} from './driving/motion.js';
import {headlinerBottom} from './driving/camera.js';
import {createDrive, accelerate, accelerateSteering, advanceDrive, depthAt, rearDepthAt, SCENERY_PACE, CRUISE_SPEED, MAX_SPEED} from './driving/drive.js';
import {renderPins} from './scene/tech-stack.js';
import {createPinMotion,stepPinMotion} from './animations/pin-motion.js';
import {ignitionPose,keyringRotation} from './animations/ignition-motion.js';
import {usbFlightFrames} from './animations/usb-flight.js';
import {wheelContains,wheelScrollTurn,createCrash,advanceCrash,crashPose,shouldCrash} from './driving/crash.js';
import {projects,projectIndex,renderProject,renderCaseStudy,renderCasePages,caseSpreadIndex,caseSpreadCount} from './projects/projects.js';
import {clearWorkspaceAnimations,pageTurnFrames,pageTurnDuration} from './animations/dialog-motion.js';

const $ = selector => document.querySelector(selector);
const app = $('#app'), stage = $('#stage'), card = $('#card'), ignition = $('#ignition');
const quickNav=$('#quick-nav'),quickToggle=$('#quick-toggle'),quickPanel=$('#quick-panel');
const shortcutKeys=['about','projects','resume','contact'];
let menuOpen=false,shortcutRevision=0;
const ignitionKey=$('.key-turn'), ignitionRings=[...document.querySelectorAll('.keyring-swing')];
let ignitionElapsed=0,ignitionTurning=false,ignitionStartedAt=0,ignitionDuration=.76,ignitionRing=createPendulum(.008);
const radio = $('#radio'), usb = $('#usb');
const carBody = $('.car'), suspension = $('.rumble'), wheel = $('.wheel');
const rpmNeedle = $('#rpm-needle'), speedNeedle = $('#speed-needle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const startButton=$('#start');
const finishIgnitionReveal=()=>{
  ignition.classList.add('ready');
  startButton.disabled=false;
};
requestAnimationFrame(()=>{
  requestAnimationFrame(()=>{
    ignition.classList.add('revealing');
    setTimeout(finishIgnitionReveal,reduced.matches?1380:1480);
  });
});
const cordLeft = $('#cord-left'), cordRight = $('#cord-right'), usbBody = $('.usb-drive');
let usbPendulum = createPendulum(reduced.matches ? .008 : .04);
const mouse = matchMedia('(hover: hover) and (pointer: fine)');
const order = ['about', 'projects', 'glove', 'profiles'];
const names = {about:'ABOUT', projects:'PROJECTS', glove:'GLOVEBOX', profiles:'PROFILES'};
const objects = {about:$('.visor'), projects:usb, glove:$('#glove'), profiles:$('.radio-socials')};
const interactionLabels={about:'About me',projects:'Projects',glove:'Glovebox',profiles:'Profile links'};
for(const [key,node] of Object.entries(objects)){
  node.classList.add('has-interaction-cue');
  const cue=document.createElement('span');
  cue.className='interaction-cue';cue.setAttribute('aria-hidden','true');
  const label=document.createElement('span');
  label.className='interaction-label';label.textContent=interactionLabels[key];label.setAttribute('aria-hidden','true');
  node.append(cue,label);
}
const resumeLabel=document.createElement('span');
resumeLabel.className='interaction-label resume-hover-label';resumeLabel.textContent='Resume';resumeLabel.setAttribute('aria-hidden','true');
$('.glove-assembly').append(resumeLabel);
const connectLabel=document.createElement('span');
connectLabel.className='interaction-label connect-hover-label';connectLabel.textContent='Let’s Connect';connectLabel.setAttribute('aria-hidden','true');
$('.glove-assembly').append(connectLabel);
$('.tech-pins').innerHTML=renderPins();
const loosePins=Array.from(document.querySelectorAll('.tech-pin'),node=>({node,state:createPinMotion()}));
const seen = new Set();
let started = false, starting = false, dragging = null, moved = false;
let size = layout(innerWidth, innerHeight), camera = {x:0,y:0}, target = {x:0,y:0};
let cameraPan={x:null,y:null};
let velocity = {x:0,y:0}, pointer = null, keyboardInput = false;
let priorTime = performance.now(), frame = 0, cueTime = 0;
let drivingTime = 0;
let drive = createDrive();
const roadMarks = [], roadsideObjects = [];
const rearMarks = [], rearPosts = [];
let inserted = false, usbAnimation = null, usbRevision = 0;
let selectedProject=0,radioScrollTotal=0,radioScrollAt=-Infinity;
let paperDeparture=null,paperArrival=null,radioDeparture=null;
let tabletFade=null,tabletSwap=0;
let paperScrollTotal=0,paperScrollAt=-Infinity;
let cardTransition=null,cardClosing=false,cardRevision=0;
let caseSpread=0,caseTurning=false,caseWheelTotal=0,caseWheelAt=0,caseTurnRevision=0,caseWheelCooldownUntil=0;
let caseTurnAnimations=[];
let usbFlightFocus=false;
let crash=null,crashHit=false,crashRenewed=false,crashStartWheel=0,crashCooldown=0;
let wheelIntent=0,wheelRotation=0,wheelIdle=0;
let wheelGestureStart=null,wheelScrollTravel=0;
const crashTree=$('#crash-tree'),crashVeil=$('#crash-veil');
const crashObjects=[{node:$('.visor'),tilt:31},{node:$('.mirror'),tilt:-28},{node:radio,tilt:7},{node:$('.radio-socials'),tilt:5},{node:$('.papers'),tilt:-28}];

function limits() {return bounds(innerWidth, innerHeight, size.width, size.height);}
function stopLook() {pointer = null; velocity = {x:0,y:0}; target = {...camera};}
function fit(initial = false) {
  size = layout(innerWidth, innerHeight);
  const limit = limits();
  stage.style.setProperty('--w', `${size.width}px`);
  stage.style.setProperty('--h', `${size.height}px`);
  stage.style.setProperty('--visor-top', `${(size.height-innerHeight)/2-limit.home-10}px`);
  stage.style.setProperty('--roof-bottom', `${headlinerBottom(size.height,innerHeight,limit.home)}px`);
  if (initial) {
    target = constrain({x:innerWidth <= 600 ? 0 : size.width*.035,y:limit.home},limit);
    camera = {...target};
  } else {camera=constrain(camera,limit); target=constrain(target,limit);}
  // The connector points upward into the socket; the drive body hangs below the stereo.
  const mount = $('.usb-mount');
  const port = $('.radio-usb-port');
  stage.style.setProperty('--dock-x', `${port.offsetLeft+port.offsetWidth/2-mount.offsetLeft-21}px`);
  stage.style.setProperty('--dock-y', `${port.offsetTop+port.offsetHeight/2-mount.offsetTop+102.1}px`);
}
fit(true); addEventListener('resize',()=>fit());

function refreshGuide() {
  const current = order.find(key=>!seen.has(key));
  for (const key of order) {
    objects[key].classList.toggle('guided',key===current);
    objects[key].classList.toggle('visited',seen.has(key));
  }
  $('#progress').textContent = `${seen.size} of ${order.length} explored`;
}
function mark(key) {seen.add(key);refreshGuide();}
refreshGuide();
function setQuickMenu(open,returnFocus=false){
  menuOpen=Boolean(open)&&!crash;
  quickPanel.hidden=!menuOpen;
  quickNav.classList.toggle('expanded',menuOpen);
  quickToggle.setAttribute('aria-expanded',String(menuOpen));
  quickToggle.setAttribute('aria-label',menuOpen?'Close Quick Access menu':'Open Quick Access menu');
  stopLook();
  if(menuOpen)quickPanel.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0)'}],{duration:140,easing:'ease-out'});
  if(returnFocus)quickToggle.focus({preventScroll:true});
}
setQuickMenu(false);
quickToggle.addEventListener('click',()=>setQuickMenu(!menuOpen));
document.addEventListener('pointerdown',event=>{
  if(menuOpen&&!quickNav.contains(event.target))setQuickMenu(false);
});
quickNav.addEventListener('focusout',event=>{
  if(menuOpen&&!quickNav.contains(event.relatedTarget))setQuickMenu(false);
});
quickNav.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&menuOpen){event.preventDefault();event.stopPropagation();setQuickMenu(false,true);return;}
  if(!['ArrowDown','ArrowUp'].includes(event.key))return;
  event.preventDefault();event.stopPropagation();
  if(!menuOpen)setQuickMenu(true);
  const links=shortcutKeys.map(key=>$(`#shortcut-${key}`));
  const current=links.indexOf(document.activeElement),step=event.key==='ArrowDown'?1:-1;
  links[current<0?(step>0?0:links.length-1):(current+step+links.length)%links.length].focus();
});
function useShortcut(key){
  if(crash)return;
  const revision=++shortcutRevision;
  setQuickMenu(false);
  const open=()=>{
    if(crash||revision!==shortcutRevision)return;
    if(key==='about')$('.visor').click();
    if(key==='resume'){
      if(!$('#glove-assembly').classList.contains('opened'))$('#glove').click();
    }
    if(key==='contact'){
      mark('profiles');
      showCard('contact','Let’s connect.','CONTACT / PROFILES',quickToggle);
    }
    if(key==='projects'){
      const openProjects=()=>{
        if(crash||revision!==shortcutRevision)return;
        mark('projects');
        showCard('projects','Project files.','PROJECT FILES',quickToggle);
      };
      if(!inserted)usb.click();
      if(usbAnimation){const flight=usbAnimation;flight.finish();flight.finished.then(openProjects).catch(()=>{});}
      else openProjects();
    }
    if(card.open)card.returnFocus=quickToggle;
  };
  if(started)open();
  else{
    startDrive(true);
    const waitForDrive=()=>{if(revision!==shortcutRevision)return;if(started)open();else setTimeout(waitForDrive,40);};
    waitForDrive();
  }
}
for(const key of shortcutKeys)$(`#shortcut-${key}`).addEventListener('click',()=>useShortcut(key));
function showCard(key,title,category,focusTarget) {
  if(crash)return;
  cancelCaseTurn();
  ++cardRevision;cardTransition?.cancel();cardTransition=null;cardClosing=false;
  clearWorkspaceAnimations($('.dialog-workspace'),$('.case-workspace'));
  clearPaperTransition();
  stopLook();
  card.classList.remove('case-study-card','case-opening');
  $('.case-workspace').inert=false;
  $('.case-workspace').hidden=true;
  $('.dialog-workspace').hidden=false;
  card.classList.toggle('folder-card',key==='projects'||key==='contact');
  card.classList.toggle('contact-card',key==='contact');
  card.classList.toggle('id-card-dialog',key==='about');
  $('.project-tablet').hidden=key!=='projects';
  $('#category').textContent=category; $('#card-title').textContent=title;
  $('#card-body').replaceChildren($(`#${key}-content`).content.cloneNode(true));
  if(key==='projects'){
    renderProjectPaper();
    $('#project-previous').addEventListener('click',()=>switchProject(-1));
    $('#project-next').addEventListener('click',()=>switchProject(1));
  }
  if(key==='about')setupInspectID();
  card.returnFocus=focusTarget||document.activeElement;
  if (!card.open) card.showModal();
  if(key==='projects'||key==='about'||key==='contact')cardTransition=$('.dialog-workspace').animate([
    {opacity:0,transform:'translateY(38px)'},
    {opacity:1,transform:'translateY(0)'}
  ],{duration:340,easing:'cubic-bezier(.2,.75,.3,1)'});
}
function closeCard(){
  if(!card.open||cardClosing)return;
  cancelCaseTurn();
  if(!card.classList.contains('folder-card')&&!card.classList.contains('id-card-dialog')){card.close();return;}
  cardClosing=true;clearPaperTransition();cardTransition?.cancel();
  const revision=++cardRevision;
  cardTransition=$(card.classList.contains('case-study-card')?'.case-workspace':'.dialog-workspace').animate([
    {opacity:1,transform:'translateY(0)'},
    {opacity:0,transform:'translateY(34px)'}
  ],{duration:220,easing:'ease-in',fill:'forwards'});
  cardTransition.finished.then(()=>{if(revision===cardRevision)card.close();}).catch(()=>{});
}
$('#close').addEventListener('click',closeCard);
card.addEventListener('click',event=>{
  const pageButton=event.target.closest('[data-case-page]');
  if(pageButton)turnCasePage(Number(pageButton.dataset.casePage));
  if(event.target.closest('[data-open-case-study]'))openCaseStudy();
  if(event.target.closest('[data-case-close]'))closeCard();
  if(event.target.closest('[data-case-back]')){
    if(cardClosing||card.classList.contains('case-opening'))return;
    cancelCaseTurn();
    card.classList.add('case-opening');
    const revision=++cardRevision;
    cardTransition?.cancel();
    cardTransition=$('.case-workspace').animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(34px)'}],{duration:220,fill:'forwards',easing:'ease-in'});
    cardTransition.finished.then(()=>{
      if(revision!==cardRevision||!card.open)return;
      showCard('projects',projects[selectedProject].name,'PROJECT FILES',$('#project-play'));
      $('[data-open-case-study]').focus({preventScroll:true});
    }).catch(()=>{});
  }
});
function openCaseStudy(){
  if(cardClosing||card.classList.contains('case-study-card'))return;
  if(card.classList.contains('case-opening')&&cardTransition?.playState==='running')return;
  const markup=renderCaseStudy(selectedProject);
  clearPaperTransition();stopLook();card.classList.add('case-opening');
  const revision=++cardRevision;
  cardTransition?.cancel();
  const departure=$('.dialog-workspace').animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(34px)'}],{duration:240,easing:'ease-in',fill:'forwards'});
  cardTransition=departure;
  departure.finished.then(async()=>{
    if(revision!==cardRevision||!card.open)return;
    caseSpread=0;caseWheelTotal=0;caseWheelAt=performance.now();caseWheelCooldownUntil=0;
    $('.case-workspace').innerHTML=markup;
    $('.case-workspace').inert=true;
    $('.dialog-workspace').hidden=true;$('.case-workspace').hidden=false;
    departure.cancel();
    card.classList.remove('case-opening');card.classList.add('case-study-card');
    fitCasePages();
    $('#card-title').textContent=`${projects[selectedProject].name} case study`;
    cardTransition=$('.case-workspace').animate([{opacity:0,transform:`translateY(${reduced.matches?0:65}px)`},{opacity:1,transform:'translateY(0)'}],{duration:reduced.matches?120:500,easing:'cubic-bezier(.2,.75,.3,1)'});
    await cardTransition.finished;
    if(revision!==cardRevision||!card.open)return;
    $('.case-workspace').inert=false;
    $('[data-case-back]').focus({preventScroll:true});
  }).catch(error=>{
    if(revision!==cardRevision||!card.open||error?.name==='AbortError')return;
    console.error('Unable to open case study:',error);
    showCard('projects',projects[selectedProject].name,'PROJECT FILES',$('#project-play'));
  });
}
function cancelCaseTurn(){
  ++caseTurnRevision;caseTurnAnimations.forEach(animation=>animation.cancel());caseTurnAnimations=[];
  document.querySelectorAll('.case-flip-overlay,.case-binding-overlay,.case-turning-leaf,.case-under-leaf').forEach(node=>node.remove());
  document.querySelectorAll('.case-document-stack>.case-leaf').forEach(node=>node.style.removeProperty('visibility'));
  document.querySelectorAll('.case-document-stack').forEach(node=>node.style.removeProperty('z-index'));
  caseTurning=false;caseWheelTotal=0;
}
function fitCasePages(){
  if(!card.classList.contains('case-study-card')||caseTurning)return;
  document.querySelectorAll('.case-leaf:not(.case-turning-leaf):not(.case-under-leaf)').forEach(leaf=>{
    const content=leaf.querySelector('.case-page-content');
    if(!content)return;
    const leafRect=leaf.getBoundingClientRect();
    document.querySelectorAll('.case-folder>.case-binding-front i').forEach((ring,index)=>{
      const ringRect=ring.getBoundingClientRect();
      leaf.style.setProperty(`--punch-y-${index}`,`${ringRect.top+ringRect.height*.65-leafRect.top-4}px`);
    });
    const styles=getComputedStyle(leaf);
    const width=leaf.clientWidth-parseFloat(styles.paddingLeft)-parseFloat(styles.paddingRight);
    const height=leaf.clientHeight-parseFloat(styles.paddingTop)-parseFloat(styles.paddingBottom);
    if(width<=0||height<=0)return;
    content.style.removeProperty('zoom');content.style.width=`${width}px`;
    content.style.height=`${height}px`;content.style.minHeight='0';
    const teamLayout=content.querySelector('.case-team-layout');
    if(teamLayout){
      const photo=teamLayout.querySelector('.case-team-photo'),caption=photo.querySelector('figcaption');
      const photoStyles=getComputedStyle(photo),captionStyles=getComputedStyle(caption);
      const frameWidth=parseFloat(photoStyles.paddingLeft)+parseFloat(photoStyles.paddingRight)+2;
      const frameHeight=parseFloat(photoStyles.paddingTop)+parseFloat(photoStyles.paddingBottom)+2;
      const columnWidth=parseFloat(getComputedStyle(teamLayout).gridTemplateColumns);
      // Size the paper around the portrait, instead of letterboxing the image inside a wide frame.
      photo.style.removeProperty('width');
      for(let i=0;i<3;i++){
        const captionHeight=caption.offsetHeight+parseFloat(captionStyles.marginTop);
        const imageHeight=Math.max(0,teamLayout.clientHeight-frameHeight-captionHeight-8);
        photo.style.width=`${Math.min(columnWidth,imageHeight*.75+frameWidth)}px`;
      }
      leaf.scrollTop=0;return;
    }
    const figure=content.querySelector('.case-team-photo,.case-showcase');
    if(figure){
      figure.style.removeProperty('width');
      for(let i=0;i<3;i++){
        const overflow=content.scrollHeight-height;
        if(overflow<=1)break;
        const img=figure.querySelector('img');
        const ratio=(Number(img.getAttribute('width'))||img.naturalWidth)/(Number(img.getAttribute('height'))||img.naturalHeight);
        const imageHeight=img.getBoundingClientRect().height;
        if(!Number.isFinite(ratio)||imageHeight<=0)break;
        figure.style.width=`${Math.min(width,Math.max(100,imageHeight-overflow-2)*ratio+14)}px`;
      }
    }
    leaf.scrollTop=0;
  });
}
addEventListener('resize',()=>{cancelCaseTurn();fitCasePages();});
card.addEventListener('load',event=>{if(event.target.matches('.case-image-mount img,.case-showcase img,.case-team-photo img'))fitCasePages();},true);
async function turnCasePage(direction,duration=480){
  const workspace=$('.case-workspace');
  if(!card.open||!card.classList.contains('case-study-card')||workspace.inert||caseTurning||cardClosing||card.classList.contains('case-opening'))return;
  const count=caseSpreadCount(selectedProject);
  const next=caseSpreadIndex(caseSpread+direction,count);
  if(next===caseSpread)return;
  caseTurning=true;caseWheelTotal=0;
  const revision=++caseTurnRevision;
  const stacks=[...workspace.querySelectorAll('.case-document-stack')];
  const outgoingIndex=direction>0?1:0,incomingIndex=1-outgoingIndex;
  const outgoing=stacks[outgoingIndex].querySelector('.case-leaf').cloneNode(true);
  const under=stacks[incomingIndex].querySelector('.case-leaf').cloneNode(true);
  outgoing.classList.add('case-turning-leaf');under.classList.add('case-under-leaf');
  for(const layer of [outgoing,under]){layer.inert=true;layer.setAttribute('aria-hidden','true');}
  const pages=renderCasePages(selectedProject,next);
  stacks.forEach((stack,i)=>{stack.innerHTML=pages[i];});
  caseTurning=false;fitCasePages();caseTurning=true;
  const folder=workspace.querySelector('.case-folder');
  const overlay=document.createElement('div');overlay.className='case-flip-overlay';overlay.inert=true;overlay.setAttribute('aria-hidden','true');
  const incomingPage=stacks[incomingIndex].querySelector('.case-leaf');
  const incoming=incomingPage.cloneNode(true);incoming.classList.add('case-flip-back');
  outgoing.classList.add('case-flip-front');
  const sheet=document.createElement('div');sheet.className='case-flipping-sheet';
  const place=(page,stack)=>Object.assign(page.style,{inset:'auto',left:`${folder.offsetLeft+folder.clientLeft+stack.offsetLeft}px`,top:`${folder.offsetTop+folder.clientTop+stack.offsetTop}px`,width:`${stack.offsetWidth}px`,height:`${stack.offsetHeight}px`});
  place(sheet,stacks[outgoingIndex]);
  incomingPage.style.visibility='hidden';stacks[incomingIndex].prepend(under);
  sheet.append(outgoing,incoming);overlay.append(sheet);workspace.append(overlay);
  const binding=folder.querySelector('.case-binding-front');
  const bindingLayer=binding.cloneNode(true);bindingLayer.classList.add('case-binding-overlay');
  const bindingRect=binding.getBoundingClientRect(),workspaceRect=workspace.getBoundingClientRect();
  Object.assign(bindingLayer.style,{inset:'auto',left:`${bindingRect.left-workspaceRect.left+workspace.scrollLeft}px`,top:`${bindingRect.top-workspaceRect.top+workspace.scrollTop}px`,width:`${bindingRect.width}px`,height:`${bindingRect.height}px`,transform:'none'});
  workspace.append(bindingLayer);
  sheet.style.transformOrigin=direction>0?'0 50%':'100% 50%';
  const source=stacks[outgoingIndex],target=stacks[incomingIndex];
  const reflectedLeft=source.offsetLeft+(direction>0?-source.offsetWidth:source.offsetWidth);
  const frames=pageTurnFrames(direction,target.offsetLeft-reflectedLeft,target.offsetTop-source.offsetTop);
  caseTurnAnimations=[
    sheet.animate(frames,{duration,easing:'linear',fill:'both'}),
    bindingLayer.animate([{offset:0,opacity:1},{offset:.349,opacity:1},{offset:.35,opacity:0},{offset:.65,opacity:0},{offset:.651,opacity:1},{offset:1,opacity:1}],{duration,easing:'linear',fill:'both'})
  ];
  const punchArc=Math.min(6,binding.querySelector('i').offsetHeight*.25);
  sheet.querySelectorAll('.case-punch-holes').forEach(holes=>{
    caseTurnAnimations.push(holes.animate([
      {offset:0,transform:'translateY(0)'},
      {offset:.25,transform:`translateY(${punchArc*.7}px)`},
      {offset:.5,transform:`translateY(${punchArc}px)`},
      {offset:.75,transform:`translateY(${punchArc*.7}px)`},
      {offset:1,transform:'translateY(0)'}
    ],{duration,easing:'linear',fill:'both'}));
  });
  caseSpread=next;
  $('[data-case-page-count]').innerHTML=`${String(next+1).padStart(2,'0')} / ${String(count).padStart(2,'0')} <small>SCROLL TO TURN PAGES</small>`;
  $('[data-case-page="-1"]').disabled=next===0;$('[data-case-page="1"]').disabled=next===count-1;
  try{await Promise.all(caseTurnAnimations.map(animation=>animation.finished));}
  catch{return;}
  finally{if(revision===caseTurnRevision){cancelCaseTurn();fitCasePages();caseWheelCooldownUntil=0;}}
}
card.addEventListener('wheel',event=>{
  if(!card.classList.contains('case-study-card')||event.ctrlKey||Math.abs(event.deltaY)<=Math.abs(event.deltaX))return;
  event.preventDefault();event.stopPropagation();
  const amount=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  const now=performance.now(),elapsed=now-caseWheelAt;caseWheelAt=now;
  if($('.case-workspace').inert||now<caseWheelCooldownUntil)return;
  const duration=pageTurnDuration(amount,elapsed);
  if(caseTurning){
    for(const animation of caseTurnAnimations)animation.playbackRate=Math.max(animation.playbackRate||1,480/duration);
    return;
  }
  if(elapsed>450||Math.sign(amount)!==Math.sign(caseWheelTotal))caseWheelTotal=0;
  caseWheelTotal+=amount;
  if(Math.abs(caseWheelTotal)>=45)turnCasePage(Math.sign(caseWheelTotal),duration);
},{passive:false});
card.addEventListener('keydown',event=>{
  if(!card.classList.contains('case-study-card')||!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','PageDown','PageUp'].includes(event.key))return;
  event.preventDefault();turnCasePage(['ArrowDown','ArrowRight','PageDown'].includes(event.key)?1:-1);
});
card.addEventListener('cancel',event=>{event.preventDefault();closeCard();});
card.addEventListener('close',()=>{
  ++cardRevision;cardTransition?.cancel();cardTransition=null;cardClosing=false;
  clearPaperTransition();stopLook();card.returnFocus?.focus({preventScroll:true});
});
card.addEventListener('click',event=>{
  if (event.target!==card) return;
  const box=card.getBoundingClientRect();
  if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom) {
    if(card.returnFocus?.closest('.glove-assembly')) card.returnFocus=$('#glove');
    setGlove(false);closeCard();
  }
});
$('.visor').addEventListener('click',()=>{mark('about');showCard('about','Hi, I’m Martin.','BEHIND THE WHEEL',$('.visor'));});
function setupInspectID(){
  const object=$('#id-turntable'),button=$('#id-flip');
  let back=false;
  function flip(){
    back=!back;
    object.style.setProperty('--id-turn',back?'180deg':'0deg');
    button.setAttribute('aria-pressed',String(back));
    button.textContent=back?'Turn to front ↶':'Turn over ↻';
    $('#id-side').textContent=back?'BACK / ABOUT':'FRONT / DRIVER ID';
    $('#id-front').inert=back;$('#id-back').inert=!back;
    $('#id-front').setAttribute('aria-hidden',String(back));
    $('#id-back').setAttribute('aria-hidden',String(!back));
  }
  $('#id-back').inert=true;
  button.addEventListener('click',flip);
  object.addEventListener('click',event=>{if(!event.target.closest('a,button'))flip();});
  object.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse')return;
    const rect=$('.id-inspection').getBoundingClientRect();
    object.style.setProperty('--inspect-x',`${-(event.clientY-rect.top-rect.height/2)/rect.height*10}deg`);
    object.style.setProperty('--inspect-y',`${(event.clientX-rect.left-rect.width/2)/rect.width*12}deg`);
  });
  object.addEventListener('pointerleave',()=>{
    object.style.setProperty('--inspect-x','0deg');object.style.setProperty('--inspect-y','0deg');
  });
}
$('.radio-socials').addEventListener('click',event=>{
  if(event.target.closest('a')){mark('profiles');stopLook();}
});

function radioOff() {
  radioDeparture?.remove();radioDeparture=null;
  $('#radio-previous').disabled=true;$('#radio-next').disabled=true;
  radioScrollTotal=0;
  radio.className='radio-display off';
  radio.innerHTML='<span class="radio-meta">USB AUDIO</span><strong>RADIO OFF</strong><span class="radio-message">Insert the USB to play.</span>';
}
function projectPlaylist(direction=0) {
  radioDeparture?.remove();radioDeparture=null;
  const departing=direction?$('#project-play')?.cloneNode(true):null;
  const project=projects[selectedProject];
  $('#radio-previous').disabled=false;$('#radio-next').disabled=false;
  radio.className='radio-display powered';
  radio.innerHTML=`<span class="radio-meta">USB / PROJECT ${selectedProject+1} OF ${projects.length}</span><button id="project-play"><span class="play-symbol" aria-hidden="true">▶</span><span>${project.name}<small>OPEN PROJECT FILE ↗</small></span></button><span class="radio-browse-hint">↑ ↓ / SCROLL TO BROWSE</span>`;
  $('#project-play').addEventListener('click',()=>showCard('projects','Project files.','PROJECT FILES',$('#project-play')));
  if(departing){
    departing.removeAttribute('id');departing.setAttribute('aria-hidden','true');departing.inert=true;
    departing.classList.add('radio-departing-track');radio.append(departing);radioDeparture=departing;
    departing.animate([
      {opacity:1,transform:'translateY(-50%) translateY(0) scale(1)'},
      {opacity:0,transform:`translateY(-50%) translateY(${-direction*24}px) scale(.9)`}
    ],{duration:150,easing:'ease-in'}).finished.then(()=>departing.remove()).catch(()=>departing.remove());
    $('#project-play').animate([
      {opacity:0,transform:`translateY(${direction*24}px) scale(.92)`},
      {opacity:1,transform:'translateY(0) scale(1)'}
    ],{delay:95,duration:210,fill:'backwards',easing:'cubic-bezier(.2,.75,.3,1)'});
  }
}
function clearPaperTransition(){
  ++tabletSwap;tabletFade?.cancel();tabletFade=null;
  paperArrival?.cancel();paperArrival=null;
  paperDeparture?.remove();paperDeparture=null;
}
function renderProjectPaper(direction=0){
  clearPaperTransition();
  const sheet=$('.card-sheet');
  const departing=direction?sheet.cloneNode(true):null;
  const paper=$('#project-document');
  paper.innerHTML=renderProject(selectedProject);
  const project=projects[selectedProject];
  const preview=$('#tablet-preview'),revision=tabletSwap;
  const updatePreview=()=>{
    if(revision!==tabletSwap)return;
    preview.src=project.preview;preview.style.objectFit='cover';
    preview.alt=`${project.name} project screenshot`;
    $('#tablet-caption').textContent=project.name;
  };
  if(direction){
    tabletFade=preview.animate([
      {offset:0,opacity:1},
      {offset:.42,opacity:0},
      {offset:.52,opacity:0},
      {offset:1,opacity:1}
    ],{duration:220,easing:'ease-in-out'});
    setTimeout(updatePreview,105);
  }else updatePreview();
  $('#card-title').textContent=projects[selectedProject].name;
  $('#project-count').textContent=`${selectedProject+1} / ${projects.length}`;
  if(departing){
    departing.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
    departing.setAttribute('aria-hidden','true');departing.inert=true;departing.classList.add('departing-sheet');
    $('.dialog-stack').append(departing);paperDeparture=departing;
    departing.animate([
      {offset:0,zIndex:3,transform:'translate3d(0,0,0) rotate(0deg) scale(1)'},
      {offset:.44,zIndex:3,transform:`translate3d(${-direction*46}px,-12px,0) rotate(${-direction*3}deg) scale(.98)`},
      {offset:.5,zIndex:-3,transform:`translate3d(${-direction*46}px,-12px,0) rotate(${-direction*3}deg) scale(.98)`},
      {offset:1,zIndex:-3,transform:'translate3d(-6px,6px,0) rotate(-1.4deg) scale(.98)'}
    ],{duration:620,fill:'forwards',easing:'cubic-bezier(.4,0,.3,1)'}).finished.then(()=>departing.remove()).catch(()=>departing.remove());
    paperArrival=sheet.animate([
      {offset:0,zIndex:-3,transform:'translate3d(9px,11px,0) rotate(2deg) scale(.98)'},
      {offset:.44,zIndex:-3,transform:`translate3d(${direction*46}px,-18px,0) rotate(${direction*3}deg) scale(.98)`},
      {offset:.5,zIndex:3,transform:`translate3d(${direction*46}px,-18px,0) rotate(${direction*3}deg) scale(.98)`},
      {offset:1,zIndex:3,transform:'translate3d(0,0,0) rotate(0deg) scale(1)'}
    ],{duration:620,easing:'cubic-bezier(.4,0,.3,1)'});
  }
}
function switchProject(direction){
  const browsingProjectPapers=card.open&&card.classList.contains('folder-card')&&!card.classList.contains('case-study-card')&&!card.classList.contains('contact-card');
  if(crash||cardClosing||(!browsingProjectPapers&&(!inserted||usbAnimation))||card.classList.contains('case-opening')||card.classList.contains('case-study-card')||card.classList.contains('contact-card'))return;
  selectedProject=projectIndex(selectedProject+direction);
  stopLook();
  if(inserted&&!usbAnimation)projectPlaylist(direction);
  if(browsingProjectPapers){
    renderProjectPaper(direction);card.returnFocus=$('#project-play');
  }
}
$('#radio-previous').addEventListener('click',()=>switchProject(-1));
$('#radio-next').addEventListener('click',()=>switchProject(1));
card.addEventListener('keydown',event=>{
  if(!card.classList.contains('folder-card')||!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();switchProject(event.key==='ArrowLeft'?-1:1);
});
card.addEventListener('wheel',event=>{
  if(!card.open||!card.classList.contains('folder-card')||card.classList.contains('case-study-card')||card.classList.contains('contact-card')||event.ctrlKey)return;
  const vertical=Math.abs(event.deltaY)>=Math.abs(event.deltaX);
  const delta=vertical?event.deltaY:event.deltaX;
  if(!delta)return;
  event.preventDefault();event.stopPropagation();
  const now=performance.now();
  if(now-paperScrollAt<380)return;
  const amount=delta*(event.deltaMode===1?16:event.deltaMode===2?(vertical?innerHeight:innerWidth):1);
  if(Math.sign(amount)!==Math.sign(paperScrollTotal))paperScrollTotal=0;
  paperScrollTotal+=amount;
  if(Math.abs(paperScrollTotal)>=45){switchProject(Math.sign(paperScrollTotal));paperScrollTotal=0;paperScrollAt=now;}
},{passive:false});
radio.addEventListener('wheel',event=>{
  if(!started||event.ctrlKey)return;
  event.preventDefault();event.stopPropagation();
  if(crash||card.open||!inserted||usbAnimation)return;
  const vertical=Math.abs(event.deltaY)>=Math.abs(event.deltaX);
  const delta=vertical?event.deltaY:event.deltaX;
  if(!delta)return;
  const amount=delta*(event.deltaMode===1?16:event.deltaMode===2?(vertical?innerHeight:innerWidth):1);
  const now=performance.now();
  if(now-radioScrollAt<260)return;
  if(Math.sign(amount)!==Math.sign(radioScrollTotal))radioScrollTotal=0;
  radioScrollTotal+=amount;
  if(Math.abs(radioScrollTotal)>=45){switchProject(Math.sign(radioScrollTotal));radioScrollTotal=0;radioScrollAt=now;}
},{passive:false});
usb.addEventListener('click',()=>{
  if(crash)return;
  mark('projects');stopLook();
  const from=getComputedStyle(usb).transform;
  const matrix=new DOMMatrix(from==='none'?undefined:from);
  const startPose={x:matrix.e,y:matrix.f,angle:Math.atan2(matrix.b,matrix.a)*180/Math.PI,scale:Math.hypot(matrix.a,matrix.b)};
  usbAnimation?.cancel();
  usb.style.removeProperty('transform');
  inserted=!inserted; const revision=++usbRevision;
  if(!inserted) usbPendulum=createPendulum(0);
  usb.classList.remove('docked');usb.classList.add('transitioning');
  usbBody.style.transform='rotateY(0deg)';
  usbFlightFocus=true;
  $('.radio-usb-port').classList.toggle('guiding',inserted);
  usb.setAttribute('aria-pressed',String(inserted));
  usb.setAttribute('aria-label','Projects');
  radioOff();
  const destination=inserted?{
    x:parseFloat(stage.style.getPropertyValue('--dock-x')),
    y:parseFloat(stage.style.getPropertyValue('--dock-y')),
    angle:180,scale:.7
  }:{x:0,y:0,angle:0,scale:1};
  const finish=()=>{
    if(revision!==usbRevision) return;
    usb.classList.toggle('docked',inserted);
    usb.querySelector('.interaction-label').textContent='Projects';
    usb.classList.remove('transitioning'); usbAnimation?.cancel();usbAnimation=null;usbFlightFocus=false;
    $('.radio-usb-port').classList.remove('guiding');
    if(inserted){
      projectPlaylist();
      $('.radio-usb-port').animate([{boxShadow:'0 0 0 0 #c6c79c99'},{boxShadow:'0 0 0 8px #c6c79c00'}],{duration:420,easing:'ease-out'});
    }
  };
  // A continuous curved flight blends the forward pop into the socket approach.
  // A shorter visible flight also preserves orientation when reduced motion is enabled.
  usbAnimation=usb.animate(usbFlightFrames(startPose,destination,reduced.matches?{popScale:1.25,arc:20}:{}),{
    duration:reduced.matches?950:inserted?1850:1550,easing:'linear',fill:'forwards'
  });
  usbAnimation.finished.then(finish).catch(()=>{});
});
function setGlove(opened) {
  $('#glove-assembly').classList.toggle('opened',opened);
  $('.glove-inside').inert=!opened;
  $('#glove').setAttribute('aria-expanded',String(opened));
  $('#glove').setAttribute('aria-label',opened?'Close glovebox':'Open glovebox to find resume and contact details');
  if(opened&&!crash) target.y=limits().top;
}
setGlove(false);
$('#glove').addEventListener('click',()=>{mark('glove');setGlove(!$('#glove-assembly').classList.contains('opened'));});
document.addEventListener('pointerdown',event=>{
  if(crash)return;
  if(!event.target.closest('#glove-assembly, #card')) setGlove(false);
});
addEventListener('keydown',event=>{
  if(crash)return;
  if(event.key==='Escape'&&!card.open) setGlove(false);
  if(event.key==='Tab') keyboardInput=true;
});
$('#resume-paper').addEventListener('click',()=>{mark('glove');stopLook();});
$('#connect-paper').addEventListener('click',()=>{mark('glove');showCard('contact','Let’s connect.','FROM THE GLOVEBOX',$('#connect-paper'));});

// Register edge intent immediately, even if the cursor exits before the next frame.
app.addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse'||dragging||usbFlightFocus||crash||menuOpen||!started||card.open) return;
  pointer={x:event.clientX,y:event.clientY};
  target=lookTarget(pointer,{width:innerWidth,height:innerHeight},camera,limits());
  velocity={x:0,y:0};
});
app.addEventListener('pointerleave',event=>{
  if(event.pointerType!=='mouse'||dragging||usbFlightFocus||crash||menuOpen||!started||card.open)return;
  target=lookTarget({x:event.clientX,y:event.clientY},{width:innerWidth,height:innerHeight},target,limits());
  pointer=null;velocity={x:0,y:0};
});
app.addEventListener('wheel',event=>{
  if(!started||card.open||event.ctrlKey) return;
  event.preventDefault();
  if(crash)return;
  const multiplier=event.deltaMode===1?16:event.deltaMode===2?innerHeight:1;
  const point={x:event.clientX,y:event.clientY},rect=wheel.getBoundingClientRect();
  if(!event.target.closest('button,a')&&wheelContains(point,rect)){
    if(crashCooldown<=0)steerWheel(wheelScrollTurn(point,rect,event.deltaX*multiplier,event.deltaY*multiplier));
    return;
  }
  drive=accelerate(drive,(event.deltaY||event.deltaX)*multiplier);
},{passive:false});
wheel.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Enter',' '].includes(event.key)||!started||card.open||crash)return;
  event.preventDefault();
  if(crashCooldown<=0)steerWheel(event.key==='ArrowLeft'?-60:60);
});
addEventListener('pointerdown',()=>{keyboardInput=false;},true);
app.addEventListener('pointerdown',event=>{
  moved=false;
  if(!started||crash||card.open||event.button!==0||event.target.closest('button, a, .glove-assembly, .radio-display')) return;
  usbFlightFocus=false;
  stopLook();
  dragging={id:event.pointerId,x:event.clientX,y:event.clientY,camera:{...camera},lastX:event.clientX,lastY:event.clientY,time:performance.now()};
  stage.classList.add('dragging');app.setPointerCapture(event.pointerId);
});
app.addEventListener('pointermove',event=>{
  if(!dragging||event.pointerId!==dragging.id) return;
  const dx=event.clientX-dragging.x,dy=event.clientY-dragging.y;
  if(Math.hypot(dx,dy)>7) moved=true;
  target=constrain({x:dragging.camera.x+dx,y:dragging.camera.y+dy},limits());
  const now=performance.now(),dt=Math.max(.008,(now-dragging.time)/1000);
  velocity={x:(event.clientX-dragging.lastX)/dt,y:(event.clientY-dragging.lastY)/dt};
  dragging.lastX=event.clientX;dragging.lastY=event.clientY;dragging.time=now;
});
function releaseDrag(event) {
  if(!dragging||event.pointerId!==dragging.id) return;
  if(performance.now()-dragging.time>100||event.type==='pointercancel') velocity={x:0,y:0};
  velocity.x=Math.max(-600,Math.min(600,velocity.x));velocity.y=Math.max(-90,Math.min(90,velocity.y));
  if(app.hasPointerCapture(event.pointerId)) app.releasePointerCapture(event.pointerId);
  dragging=null;stage.classList.remove('dragging');
}
app.addEventListener('pointerup',releaseDrag);app.addEventListener('pointercancel',releaseDrag);
app.addEventListener('lostpointercapture',()=>{dragging=null;stage.classList.remove('dragging');});
app.addEventListener('click',event=>{if(moved){event.preventDefault();event.stopPropagation();moved=false;}},true);
addEventListener('blur',()=>{stopLook();if(dragging)releaseDrag({pointerId:dragging.id,type:'pointercancel'});});
app.addEventListener('focusin',event=>{
  pointer=null;
  if(!keyboardInput||!started||card.open)return;
  const object=event.target.closest('.object, .paper, .radio-display, .wheel');if(!object)return;
  const box=object.getBoundingClientRect();
  if(box.left<12||box.right>innerWidth-12) target=constrain({x:camera.x+innerWidth/2-(box.left+box.width/2),y:camera.y},limits());
  if(box.bottom>innerHeight-20) target=constrain({x:target.x,y:camera.y+innerHeight-20-box.bottom},limits());
  app.scrollLeft=0;app.scrollTop=0;
});
function updateCue() {
  const key=order.find(item=>!seen.has(item)),cue=$('#edge-cue');
  if(!key||crash||menuOpen||!started||card.open){cue.style.display='none';return;}
  const box=objects[key].getBoundingClientRect();let direction='',x=0,y=0;
  if(box.right<25){direction='←';x=14;y=innerHeight*.45;}
  else if(box.left>innerWidth-25){direction='→';x=innerWidth-140;y=innerHeight*.45;}
  if(!direction){cue.style.display='none';return;}
  cue.textContent=`${names[key]} ${direction}`;
  cue.style.cssText=`display:block;left:${Math.max(12,x)}px;top:${Math.max(12,y)}px`;
}
function steerWheel(turn){
  const now=performance.now();
  if(wheelGestureStart===null||wheelIdle>.45){wheelGestureStart=now;wheelScrollTravel=0;}
  wheelScrollTravel+=Math.abs(turn);
  drive=accelerateSteering(drive,turn);
  stopLook();wheelIdle=0;
  wheelIntent=Math.max(-145,Math.min(145,wheelIntent+turn));
  if(shouldCrash({steering:wheelIntent,heldFor:(now-wheelGestureStart)/1000,travel:wheelScrollTravel}))beginCrash(wheelIntent);
}

function beginCrash(steering){
  if(crash)return;
  ++shortcutRevision;setQuickMenu(false);quickNav.inert=true;
  crash=createCrash(steering);crashHit=false;crashRenewed=false;
  drive=accelerateSteering(drive,120);
  crashStartWheel=wheelRotation||drivingPose(drivingTime).steering;
  stopLook();
  if(dragging)releaseDrag({pointerId:dragging.id,type:'pointercancel'});
  if(usbAnimation){
    const transform=getComputedStyle(usb).transform;
    ++usbRevision;usbAnimation.cancel();usbAnimation=null;usb.style.transform=transform;
  }
  usbFlightFocus=false;usb.classList.remove('transitioning');
  $('.radio-usb-port').classList.remove('guiding');
  setGlove(false);crashTree.hidden=false;app.classList.remove('engine-start');app.classList.add('crashing');app.inert=true;
  $('#crash-status').textContent='Whoops. Fresh ride incoming.';
}

function freshCar(){
  drive=createDrive();drivingTime=0;wheelIntent=0;wheelRotation=0;wheelIdle=0;
  wheelGestureStart=null;wheelScrollTravel=0;
  usbAnimation?.cancel();usbAnimation=null;++usbRevision;usbFlightFocus=false;inserted=false;
  usb.classList.remove('docked','transitioning');usb.style.removeProperty('transform');
  usb.setAttribute('aria-pressed','false');usb.setAttribute('aria-label','Projects');
  usb.querySelector('.interaction-label').textContent='Projects';
  usbBody.style.removeProperty('transform');usbPendulum=createPendulum(.04);radioOff();
  setGlove(false);app.classList.remove('crashed');
  crashTree.hidden=true;
  crashObjects.forEach(({node})=>{node.style.removeProperty('rotate');node.style.removeProperty('translate');});
  loosePins.forEach(pin=>{pin.state=createPinMotion();pin.node.style.removeProperty('translate');pin.node.style.removeProperty('rotate');});
  stage.style.removeProperty('--swerve-x');stage.style.removeProperty('--swerve-roll');stage.style.removeProperty('--zoom');
  fit(true);
}

function tick(time) {
  const delta=Math.min(.05,Math.max(0,(time-priorTime)/1000));priorTime=time;
  crashCooldown=Math.max(0,crashCooldown-delta);
  let collision=null;
  if(crash){
    crash=advanceCrash(crash,delta);collision=crashPose(crash);
    if(collision.struck&&!crashHit){
      crashHit=true;app.classList.add('crashed');setGlove(true);
      usbPendulum={...usbPendulum,velocity:usbPendulum.velocity+crash.direction*8};
      radio.className='radio-display off';radio.innerHTML='<span class="radio-meta">USB AUDIO</span><strong>SIGNAL LOST</strong>';
    }
    if(collision.fresh&&!crashRenewed){crashRenewed=true;freshCar();}
    crashVeil.style.opacity=String(collision.fade);
    if(collision.phase==='done'){
      crash=null;collision=null;crashCooldown=1;
      app.classList.remove('crashing');app.inert=false;quickNav.inert=false;app.focus({preventScroll:true});
      $('#crash-status').textContent='Fresh ride. Back on the road.';
    }
  }
  // Read the animated body before writing frame styles; keep its flight in view.
  if(usbFlightFocus&&usbAnimation&&!dragging&&!card.open){
    const progress=Number(usbAnimation.currentTime)/Number(usbAnimation.effect.getTiming().duration);
    if(progress>.08){
      const box=usbBody.getBoundingClientRect();
      target=constrain({x:camera.x+innerWidth*.5-(box.left+box.right)/2,y:camera.y+innerHeight*.56-(box.top+box.bottom)/2},limits());
      if(progress>.93)target=constrain({x:-size.width*.001,y:inserted?limits().top:limits().home},limits());
    }
  }
  if(!ignition.hidden){
    if(ignitionTurning)ignitionElapsed=Math.max(0,(time-ignitionStartedAt)/1000);
    const pose=ignitionPose(ignitionElapsed,ignitionDuration);
    ignitionKey.style.transform=`rotate(${pose.degrees}deg)`;
    ignitionRing=reduced.matches?createPendulum(0):stepPendulum(ignitionRing,delta,pose.acceleration,{length:76,gravity:1600,damping:3.4});
    // Cancel the parent's key rotation before applying the ring's world-space swing.
    const ringAngle=keyringRotation(pose.degrees,ignitionRing.angle);
    ignitionRings.forEach(ring=>ring.style.transform=`rotate(${ringAngle}deg)`);
  }
  if(started) {
    if(collision?.stopped)drive={...drive,speed:0,boost:0};
    else drive=advanceDrive(drive,delta);
    const motionRate=Math.min(1.55,1.18+Math.max(0,drive.speed-CRUISE_SPEED)*.1);
    drivingTime+=delta*motionRate;
    const pose=drivingPose(drivingTime,collision?.stopped?0:reduced.matches ? .2 : 1);
    wheelIdle+=delta;
    if(!crash&&wheelIdle>.35)wheelIntent*=Math.exp(-2*delta);
    wheelRotation=ease(wheelRotation,wheelIntent,12,delta);
    const turn=steeringPose(crash?0:wheelRotation,reduced.matches?.2:1);
    if(!reduced.matches&&!collision?.struck){
      const acceleration=drivingAcceleration(drivingTime,1,motionRate);
      acceleration.x+=turn.lateralLoad;
      loosePins.forEach((pin,index)=>{
        pin.state=stepPinMotion(pin.state,delta,acceleration,index);
        pin.node.style.setProperty('--pin-slide-x',`${pin.state.x.toFixed(2)}px`);
        pin.node.style.setProperty('--pin-slide-y',`${pin.state.y.toFixed(2)}px`);
        pin.node.style.setProperty('--pin-roll',`${pin.state.angle.toFixed(2)}deg`);
      });
    }
    const impactScale=reduced.matches ? .2 : 1;
    const activeCollision=collision&&!collision.fresh;
    carBody.style.transform=`translate(${pose.swayX}px,${pose.swayY}px) rotate(${pose.swayAngle+(activeCollision?collision.roll*impactScale:turn.roll)}deg)`;
    suspension.style.transform=`translate(${pose.rattleX+(collision?.shakeX||0)*impactScale}px,${pose.rattleY+(collision?.shakeY||0)*impactScale}px)`;
    const steering=activeCollision?collision.steering+crashStartWheel*(1-collision.treeProgress)+collision.wheelKick*impactScale:wheelRotation+pose.steering*Math.max(0,1-Math.abs(wheelRotation)/12);
    wheel.style.transform=`rotate(${steering}deg)`;
    rpmNeedle.setAttribute('transform',`rotate(${pose.rpm})`);
    const throttle=collision?.stopped?-1:Math.min(1,Math.max(0,(drive.speed-CRUISE_SPEED)/(MAX_SPEED-CRUISE_SPEED)));
    speedNeedle.setAttribute('transform',`rotate(${pose.speed+throttle*48})`);
    rpmNeedle.setAttribute('transform',`rotate(${pose.rpm+throttle*26})`);
    renderRoad(drive.distance);
    if(activeCollision){
      const shift=collision.roadShift*size.width;
      stage.style.setProperty('--swerve-x',`${shift}px`);
      stage.style.setProperty('--swerve-roll',`${-collision.roll*.35*impactScale}deg`);
      stage.style.setProperty('--zoom',String(1+(collision.zoom-1)*impactScale));
      const p=collision.treeProgress;
      const treeX=size.width*(.5+crash.direction*.35*(1-p))-shift;
      const treeScale=size.height*(.18+2.8*p**2)/520;
      crashTree.style.transform=`translate(${treeX}px,${size.height*.74}px) scale(${treeScale})`;
      if(collision.struck){
        const t=collision.impactTime,d=crash.direction;
        crashObjects.forEach(({node,tilt},i)=>{
          node.style.rotate=`${d*tilt*1.4*(1-Math.exp(-t*16))*impactScale}deg`;
          node.style.translate=`${d*Math.sin(t*35+i)*Math.exp(-t*5)*48*impactScale}px ${Math.min(58,t*130)*impactScale}px`;
        });
        loosePins.forEach((pin,i)=>{
          pin.node.style.translate=`${d*(80+i*12)*t*impactScale}px ${(-(235+i%4*45)*t+220*t*t)*impactScale}px`;
          pin.node.style.rotate=`${(i%2?-1:1)*(200+i*26)*t*impactScale}deg`;
        });
      }
    }else{
      stage.style.setProperty('--swerve-x',`${turn.roadShift*size.width}px`);
      stage.style.setProperty('--swerve-roll',`${-turn.roll*.35}deg`);
    }
    if(!inserted&&!usbAnimation) {
      const acceleration=drivingAcceleration(drivingTime,collision?.stopped?0:reduced.matches ? .2 : 1,motionRate);
      acceleration.x+=turn.lateralLoad;
      if(collision?.struck){acceleration.x+=crash.direction*8500*Math.exp(-collision.impactTime*15)*impactScale;}
      usbPendulum=stepPendulum(usbPendulum,delta,acceleration);
      // Positive physical displacement is to the right; a hanging CSS element rotates the opposite way.
      usb.style.transform=`rotate(${-usbPendulum.angle*180/Math.PI}deg)`;
      const flex=Math.max(-3,Math.min(3,usbPendulum.velocity*7));
      cordLeft.setAttribute('d',`M-16 -28 C${-10+flex} 2 ${7+flex*.5} 40 16 61`);
      cordRight.setAttribute('d',`M58 -28 C${52+flex} 2 ${32+flex*.5} 40 23 61`);
      usbBody.style.transform=`rotateY(${-20+usbPendulum.velocity*8}deg)`;
    }
  }
  if(started&&!card.open) {
    if(collision&&!collision.fresh){
      target=constrain({x:0,y:Math.min(limits().home,limits().top+size.height*.055)},limits());
    }else if(!dragging) {
      if(pointer) {target=lookTarget(pointer,{width:innerWidth,height:innerHeight},camera,limits());velocity={x:0,y:0};}
      else {target.x+=velocity.x*delta;target.y+=velocity.y*delta;velocity.x*=Math.exp(-7*delta);velocity.y*=Math.exp(-9*delta);}
    }
    target=constrain(target,limits());
    if(dragging){
      cameraPan={x:null,y:null};
      camera.x=dragging&&!reduced.matches?ease(camera.x,target.x,17,delta):target.x;
      camera.y=dragging&&!reduced.matches?ease(camera.y,target.y,17,delta):target.y;
    }else{
      cameraPan.x=panStep(camera.x,target.x,delta,cameraPan.x);
      cameraPan.y=panStep(camera.y,target.y,delta,cameraPan.y);
      camera.x=cameraPan.x.position;camera.y=cameraPan.y.position;
    }
    camera=constrain(camera,limits());
    stage.style.setProperty('--pan-x',`${camera.x.toFixed(3)}px`);stage.style.setProperty('--pan-y',`${camera.y.toFixed(3)}px`);
    stage.style.setProperty('--outside-x',`${(-camera.x*.72).toFixed(3)}px`);stage.style.setProperty('--outside-y',`${(-camera.y*.72).toFixed(3)}px`);
  }
  if(time-cueTime>140){updateCue();cueTime=time;}
  frame=requestAnimationFrame(tick);
}
frame=requestAnimationFrame(tick);
document.addEventListener('visibilitychange',()=>{
  stopLook();
  if(document.hidden)cancelAnimationFrame(frame);
  else{priorTime=performance.now();frame=requestAnimationFrame(tick);}
});
for(let i=0;i<14;i++){
  const mark=document.createElement('i');mark.className='lane-mark';$('#lane-marks').append(mark);roadMarks.push(mark);
}
for(const side of [-1,1]){
  for(let i=0;i<8;i++){
    const tree=document.createElement('div');tree.className='passing-tree';
    tree.innerHTML='<svg viewBox="0 0 80 150" aria-hidden="true"><path d="M36 90H43V150H36Z" fill="#0b150e"/><path d="M40 0L55 29L51 31L69 60L61 63L80 99L65 110L15 108L0 97L20 62L12 60L30 31L25 29Z" fill="#142317" stroke="#0b160e" stroke-width="2"/><path d="M40 3L47 36L40 32L49 73L40 65L49 108H35L28 69L34 70L27 39Z" fill="#233622"/></svg>';
    $('#passing-scenery').append(tree);roadsideObjects.push({node:tree,side,offset:i/8+(side===1?.037:0),type:'tree'});
    const post=document.createElement('div');post.className='road-post';post.innerHTML='<i></i>';
    $('#passing-scenery').append(post);roadsideObjects.push({node:post,side,offset:i/8,type:'post'});
  }
}
for(let i=0;i<10;i++){
  const mark=document.createElementNS('http://www.w3.org/2000/svg','path');
  $('#rear-markings').append(mark);rearMarks.push(mark);
}
for(const side of [-1,1])for(let i=0;i<8;i++){
  const post=document.createElementNS('http://www.w3.org/2000/svg','path');
  $('#rear-posts').append(post);rearPosts.push({node:post,side,offset:i/8});
}
function renderRoad(distance){
  // Reduced motion keeps the sunset visible with only minimal forward drift.
  const travel=distance*SCENERY_PACE*(reduced.matches ? .15 : 1);
  rearMarks.forEach((node,i)=>{
    const p=rearDepthAt(travel,i/rearMarks.length),y=222+110*p;
    const half=.15+2.6*p,height=12*p;
    node.setAttribute('d',`M${251-half} ${y}h${half*2}l${p} ${height}h${-half*2-2*p}Z`);
  });
  rearPosts.forEach(({node,side,offset})=>{
    const p=rearDepthAt(travel,offset,4.8),x=251+side*245*p,y=222+108*p;
    node.setAttribute('d',`M${x} ${y}v${-24*p}h${3*p}v${24*p}Z`);
  });
  roadMarks.forEach((node,i)=>{
    const p=depthAt(travel,i/roadMarks.length,3.6);
    node.style.transform=`translate(${size.width*.5}px,${size.height*(.48+.5*p)}px) scale(${size.width*.008*p/14},${size.height*.075*p/36})`;
  });
  for(const object of roadsideObjects){
    const tree=object.type==='tree';
    const p=depthAt(travel,object.offset,tree?7.4:4.8);
    const x=size.width*(.5+object.side*(tree?.93:.48)*p);
    const y=size.height*(.48+.52*p);
    const scale=tree?size.height*.22*p/150:size.height*.09*p/35;
    object.node.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
  }
}
renderRoad(0);
const hint=$('#driving-hint');hint.textContent=mouse.matches?'Click a ring to explore · Scroll the wheel to steer':'Tap a ring to explore · Drag to look around';
function showIdentityIntro(){
  const intro=$('#identity-intro');
  stopLook();app.inert=true;quickNav.inert=true;
  document.body.classList.add('introducing');intro.hidden=false;
  const timing={duration:5200,easing:'linear',fill:'both'};
  const curve='cubic-bezier(.4,0,.2,1)';
  let dismissing=false,finished=false;
  const animations=[];
  const textFade=intro.animate([
    {offset:0,opacity:0,easing:curve},
    {offset:.2,opacity:1},
    {offset:.67,opacity:1,easing:curve},
    {offset:1,opacity:0}
  ],timing);
  const blurFade=app.animate([
    {offset:0,filter:'blur(0px)',easing:curve},
    {offset:.2,filter:'blur(6px)'},
    {offset:.67,filter:'blur(6px)',easing:curve},
    {offset:1,filter:'blur(0px)'}
  ],timing);
  animations.push(textFade,blurFade);
  const finish=()=>{
    if(finished)return;
    finished=true;intro.removeEventListener('click',dismiss);
    intro.hidden=true;document.body.classList.remove('introducing');
    animations.forEach(animation=>animation.cancel());
    app.inert=false;quickNav.inert=false;app.focus({preventScroll:true});
  };
  const dismiss=event=>{
    event.preventDefault();event.stopPropagation();
    if(dismissing||finished)return;
    dismissing=true;
    const opacity=getComputedStyle(intro).opacity||'1';
    const filter=getComputedStyle(app).filter||'blur(6px)';
    const exitTiming={duration:900,easing:curve,fill:'both'};
    const textExit=intro.animate([{opacity},{opacity:0}],exitTiming);
    const blurExit=app.animate([{filter},{filter:'blur(0px)'}],exitTiming);
    textFade.cancel();blurFade.cancel();
    animations.push(textExit,blurExit);
    Promise.all([textExit.finished,blurExit.finished]).then(finish,finish);
  };
  intro.addEventListener('click',dismiss);
  const finishAutomatically=()=>{if(!dismissing)finish();};
  Promise.all([textFade.finished,blurFade.finished]).then(finishAutomatically,finishAutomatically);
}
function startDrive(skipTurn = false) {
  if(started||starting)return;
  starting=true;
  $('#start').disabled=true;
  ignitionDuration=reduced.matches ? .18 : .76;
  ignitionTurning=!skipTurn;
  ignitionStartedAt=performance.now();
  if(!skipTurn)ignition.classList.add('turning');
  setTimeout(()=>{
    ignition.classList.add('leaving');ignition.inert=true;
    setTimeout(()=>{
      ignition.hidden=true;
      started=true;starting=false;document.body.classList.add('started');
      showIdentityIntro();
      app.classList.add('engine-start');
      setTimeout(()=>app.classList.remove('engine-start'),950);
      setTimeout(()=>hint.classList.add('faded'),14000);
    },620);
  },skipTurn?0:(reduced.matches?680:1460));
}
$('#start').addEventListener('click',()=>startDrive());
$('#skip').addEventListener('click',()=>startDrive(true));
reduced.addEventListener('change',stopLook);
