import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projects,projectIndex,renderProject,renderCaseStudy,renderCasePages,caseSpreadIndex,caseSpreadCount,CASE_SPREAD_COUNT} from '../src/projects/projects.js';

test('browsing project papers wraps in both directions',()=>{
  assert.equal(projects.length,3);
  assert.equal(projectIndex(-1),2);
  assert.equal(projectIndex(3),0);
  assert.equal(projectIndex(-4),2);
});

test('each project uses the matching uploaded screenshot and the portrait is bundled',()=>{
  const expected={eLife:['elife',1146,660],'Joshua Scents':['joshua-scents',1537,738],ARROWKOPO:['arrowkopo',1105,652]};
  for(const project of projects){
    const [file,width,height]=expected[project.name];
    assert.equal(project.preview,`/assets/projects/${file}.png`);
    const bytes=fs.readFileSync(new URL(`../public${project.preview}`,import.meta.url));
    assert.equal(bytes.readUInt32BE(16),width);
    assert.equal(bytes.readUInt32BE(20),height);
  }
  const portrait=fs.readFileSync(new URL('../public/assets/martin-luspo.png',import.meta.url));
  assert.equal(portrait.readUInt32BE(16),portrait.readUInt32BE(20));
});

test('each paper opens its own case study instead of leaving the portfolio',()=>{
  for(let i=0;i<projects.length;i++){
    const project=projects[i],paper=renderProject(i);
    assert.ok(paper.includes(project.name));
    assert.ok(paper.includes(project.description));
    assert.ok(paper.includes('class="project-link"'));
    assert.ok(!paper.includes('PROJECT NOTES'));
    assert.ok(!paper.includes('MARTIN LUSPO'));
    assert.ok(!paper.includes('class="action"'));
    assert.ok(paper.includes(`data-open-case-study="${i}"`));
    assert.ok(paper.includes('Open case study'));
    assert.ok(!paper.includes('target="_blank"'));
    for(const other of projects.filter(item=>item!==project))assert.ok(!paper.includes(other.url));
  }
});

test('each binder contains two paper areas, its matching project, and navigation',()=>{
  for(let i=0;i<projects.length;i++){
    const binder=renderCaseStudy(i),project=projects[i];
    assert.equal((binder.match(/class="case-leaf card-sheet"/g)||[]).length,2);
    assert.ok(binder.includes(project.name)&&binder.includes(project.caseStudy[0].title));
    assert.ok(binder.includes('data-case-back')&&binder.includes('data-case-close'));
    assert.ok(!binder.includes('document-footnote'));
    assert.ok(!binder.includes(project.caseStudyCredit));
    assert.ok(!binder.includes('CASE STUDY IN PREPARATION'));
  }
});

test('project evidence is present but placed differently in each journal',()=>{
  const expectedPlacements=['journal-photo--evidence','journal-photo--catalog','journal-photo--action'];
  for(let i=0;i<projects.length;i++){
    const pages=Array.from({length:caseSpreadCount(i)},(_,spread)=>renderCasePages(i,spread)).flat();
    const evidencePage=pages.findIndex(page=>page.includes(`src="${projects[i].preview}"`));
    assert.notEqual(evidencePage,-1);
    assert.ok(pages[evidencePage].includes(expectedPlacements[i]));
  }
  assert.deepEqual(projects.map((_,i)=>{
    const pages=Array.from({length:caseSpreadCount(i)},(_,spread)=>renderCasePages(i,spread)).flat();
    return pages.findIndex(page=>page.includes(`src="${projects[i].preview}"`));
  }),[1,2,0]);
});

test('every journal varies hand-drawn doodles, sometimes pairing them without decorating every page',()=>{
  const expected=['case-doodle--elife','case-doodle--scent','case-doodle--arrow'];
  for(let i=0;i<projects.length;i++){
    const pages=Array.from({length:caseSpreadCount(i)},(_,spread)=>renderCasePages(i,spread)).flat();
    const illustrated=pages.filter(page=>page.includes('class="case-doodle '));
    const doodleCount=(pages.join('').match(/class="case-doodle /g)||[]).length;
    assert.ok(pages.join('').includes(expected[i]));
    assert.ok(doodleCount>=6);
    assert.ok(pages.some(page=>(page.match(/class="case-doodle /g)||[]).length>1));
    assert.ok(illustrated.length<pages.length);
    assert.ok(illustrated.every(page=>page.includes('pathLength="1"')));
  }
});

test('every case study has a direct project link on its first page',()=>{
  for(let i=0;i<projects.length;i++){
    const project=projects[i],first=renderCasePages(i,0)[0];
    assert.ok(first.includes(`href="${project.url}"`));
    assert.ok(first.includes(project.caseStudyLinkLabel));
    assert.ok(first.includes('target="_blank" rel="noopener noreferrer"'));
  }
});

test('the project invitation appears only on the first page',()=>{
  for(let i=0;i<projects.length;i++){
    const pages=Array.from({length:caseSpreadCount(i)},(_,spread)=>renderCasePages(i,spread)).flat();
    assert.ok(pages[0].includes(projects[i].caseStudyLinkLabel));
    assert.ok(pages.slice(1).every(page=>!page.includes(projects[i].caseStudyLinkLabel)));
  }
});

test('eLife has a complete source-based case study without placeholder or invented impact claims',()=>{
  const pages=Array.from({length:caseSpreadCount(0)},(_,spread)=>renderCasePages(0,spread)).flat().join('');
  assert.ok(!pages.includes('CASE STUDY IN PREPARATION'));
  assert.ok(!pages.includes('will go here'));
  for(const detail of ['Never the judge.','deterministic rules','row-level security','scripted demo scenario','automated tests for the rules engine','does not establish real benefit awards'])assert.ok(pages.includes(detail));
  assert.ok(pages.includes('href="https://elife-egovph.vercel.app"'));
  assert.equal(caseSpreadCount(0),8);
  assert.ok(pages.includes('top 30 teams out of 156'));
  assert.ok(pages.includes('class="case-showcase"'));
  assert.ok(renderCaseStudy(0).includes('01 / 08'));
});

test('Joshua Scents has a complete, transparent prototype case study',()=>{
  const pages=Array.from({length:caseSpreadCount(1)},(_,spread)=>renderCasePages(1,spread)).flat().join('');
  assert.equal(caseSpreadCount(1),5);
  assert.ok(!pages.includes('CASE STUDY IN PREPARATION'));
  assert.ok(!pages.includes('will go here'));
  for(const detail of ['Fresh, Timber &amp; Smoke','Discovery sets','pause','not independently verified'])assert.ok(pages.includes(detail));
  assert.ok(renderCaseStudy(1).includes('01 / 05'));
});

test('ARROWKOPO documents the supplied mechanics and architecture',()=>{
  const pages=Array.from({length:caseSpreadCount(2)},(_,spread)=>renderCasePages(2,spread)).flat().join('');
  assert.equal(caseSpreadCount(2),4);
  assert.ok(!pages.includes('CASE STUDY IN PREPARATION'));
  assert.ok(!pages.includes('will go here'));
  for(const detail of ['Micro Dash','EMP Freeze','Hyper Dash','Thorn Barrier','Tactical Nuke','game.js'])assert.ok(pages.includes(detail));
  assert.ok(renderCaseStudy(2).includes('01 / 04'));
});

test('case study spreads have two pages, distinct content, and stop at the covers',()=>{
  assert.equal(caseSpreadIndex(-1),0);
  assert.equal(caseSpreadIndex(CASE_SPREAD_COUNT),CASE_SPREAD_COUNT-1);
  for(let i=0;i<projects.length;i++){
    const count=caseSpreadCount(i);
    const spreads=Array.from({length:count},(_,page)=>renderCasePages(i,page));
    assert.ok(spreads.every(pages=>pages.length===2));
    assert.equal(new Set(spreads.flat()).size,count*2);
    assert.ok(spreads.flat().every(page=>page.includes(projects[i].name.toUpperCase())));
  }
});
