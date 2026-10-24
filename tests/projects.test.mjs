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
    assert.ok(binder.includes(project.name)&&binder.includes(project.description));
    assert.ok(binder.includes(`src="${project.preview}"`));
    assert.ok(binder.includes('data-case-back')&&binder.includes('data-case-close'));
    assert.ok(binder.includes(i===0?'TEAM PIRACY++ / EGOVHACKATHON 2026':'CASE STUDY IN PREPARATION'));
  }
});

test('every case study has a direct project link on its first page',()=>{
  for(let i=0;i<projects.length;i++){
    const first=renderCasePages(i,0)[0];
    assert.ok(first.includes(`href="${projects[i].url}"`));
    assert.ok(first.includes(i===0?'Explore the prototype':'Open project'));
    assert.ok(first.includes('target="_blank" rel="noopener noreferrer"'));
  }
});

test('the prototype invitation appears only on the first page',()=>{
  const pages=Array.from({length:caseSpreadCount(0)},(_,spread)=>renderCasePages(0,spread)).flat();
  assert.ok(pages[0].includes('Explore the prototype'));
  assert.ok(pages.slice(1).every(page=>!page.includes('Explore the prototype')));
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
  assert.ok(renderCasePages(1,0).join('').includes('will go here'));
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
