import {elifeCaseStudy} from '../content/case-studies/elife.js';
import {joshuaScentsCaseStudy} from '../content/case-studies/joshua-scents.js';
import {arrowkopoCaseStudy} from '../content/case-studies/arrowkopo.js';

export const projects = [
  {name:'eLife', category:'CIVIC TECH / EGOVPH HACKATHON', url:'https://elife-egovph.vercel.app', preview:'/assets/projects/elife.png',
    description:'An eGovPH hackathon project that itemizes unclaimed citizen benefits using verified records, deterministic rules, and auditable eligibility receipts.',
    caseStudy:elifeCaseStudy, caseStudyCredit:'TEAM PIRACY++ / EGOVHACKATHON 2026', caseStudyLinkLabel:'Explore the prototype'},
  {name:'Joshua Scents', category:'FRAGRANCE / WEBSITE PROTOTYPE', url:'https://joshua-scents.vercel.app', preview:'/assets/projects/joshua-scents.png',
    description:'A fragrance website prototype built for a friend, exploring clean product browsing, scent discovery, and a polished brand feel.',
    caseStudy:joshuaScentsCaseStudy, caseStudyCredit:'DECANTS BY JOSHUA / WEBSITE PROTOTYPE', caseStudyLinkLabel:'Open project'},
  {name:'ARROWKOPO', category:'HTML5 CANVAS / ARCADE SURVIVAL', url:'https://arrowkopo.vercel.app', preview:'/assets/projects/arrowkopo.png',
    description:'A retro-futuristic HTML5 Canvas arcade survival game with inertia movement, dash mechanics, enemy waves, laser hazards, and cybernetic power-ups.',
    caseStudy:arrowkopoCaseStudy, caseStudyCredit:'ARROWKOPO / SYSTEM OVERDRIVE V1.3.0', caseStudyLinkLabel:'Play the game'}
];

export const projectIndex = index => ((index % projects.length) + projects.length) % projects.length;
export function renderProject(index) {
  const selected=projectIndex(index), project=projects[selected];
  return `<div class="document-heading"><span>PROJECT FILE / ${String(selected+1).padStart(3,'0')}</span><span>${project.category}</span></div>
    <h2>${project.name}</h2><p class="document-lead">${project.description}</p>
    ${project.tags?`<ul class="project-tags">${project.tags.map(tag=>`<li>${tag}</li>`).join('')}</ul>`:''}
    <button class="project-link" type="button" data-open-case-study="${selected}">Open case study &#8599;</button>`;
}

export function renderCaseStudy(index) {
  const selected=projectIndex(index),project=projects[selected];
  const pages=renderCasePages(index,0);
  const count=String(caseSpreadCount(index)).padStart(2,'0');
  return `<nav class="case-toolbar" aria-label="Case study controls"><button type="button" data-case-back>&#8592; Back to projects</button><span>CASE FILE / ${String(selected+1).padStart(3,'0')}</span><button type="button" data-case-close aria-label="Close case study">&#215;</button></nav>
    <div class="case-folder"><span class="case-folder-tab">${project.name} / CASE STUDY</span>
      <div class="case-document-stack">${pages[0]}</div>
      <div class="case-binding case-binding-rear" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="case-binding case-binding-front" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="case-document-stack">${pages[1]}</div>
    </div><nav class="case-page-controls" aria-label="Turn case study pages"><button type="button" data-case-page="-1" disabled>&#8592; Previous</button><span data-case-page-count role="status">01 / ${count} <small>SCROLL TO TURN PAGES</small></span><button type="button" data-case-page="1">Next &#8594;</button></nav>`;
}

export const CASE_SPREAD_COUNT=3;
export const caseSpreadCount=index=>Math.ceil((projects[projectIndex(index)].caseStudy?.length||CASE_SPREAD_COUNT*2)/2);
export const caseSpreadIndex=(index,count=CASE_SPREAD_COUNT)=>Math.max(0,Math.min(count-1,index));
export function renderCasePages(index,spread=0){
  const project=projects[projectIndex(index)];
  const caseStudy=project.caseStudy;
  const leaf=(number,title,body)=>`<article class="case-leaf card-sheet" data-binding-side="${number%2?'right':'left'}"><span class="case-punch-holes" aria-hidden="true"><i></i><i></i><i></i></span><div class="case-page-content"><header class="document-heading"><span>${project.name.toUpperCase()} / CASE STUDY</span><span>${String(number).padStart(2,'0')} / ${title.toUpperCase()}</span></header>${body}</div></article>`;
  if(caseStudy){
    const start=caseSpreadIndex(spread,caseSpreadCount(index))*2;
    return caseStudy.slice(start,start+2).map((page,i)=>leaf(start+i+1,page.section,`<h2>${page.title}</h2>${start+i===0?`<a class="project-link case-open-project" href="${project.url}" target="_blank" rel="noopener noreferrer">${project.caseStudyLinkLabel||'Open project'} &#8599;</a>`:''}${page.body}`));
  }
  const placeholder=(label,copy)=>`<div class="case-placeholder"><span>${label}</span><p>${copy}</p><div class="case-writing-lines" aria-hidden="true"></div></div>`;
  if(caseSpreadIndex(spread)===0)return[
    leaf(1,'Overview',`<h2>${project.name}</h2><a class="project-link case-open-project" href="${project.url}" target="_blank" rel="noopener noreferrer">Open project &#8599;</a><p class="case-category">${project.category}</p><p class="document-lead">${project.description}</p>${placeholder('THE BRIEF','The story behind the project will go here.')}`),
    leaf(2,'The work',`<div class="case-image-mount"><img src="${project.preview}" alt="${project.name} project preview"></div>${placeholder('BEHIND THE SCENES','Space for the process, decisions, and details.')}`)
  ];
  if(caseSpreadIndex(spread)===1)return[
    leaf(3,'Process',`<h2>The process.</h2>${placeholder('EXPLORATION','Research, early ideas, and sketches will go here.')}${placeholder('DECISIONS','Space for the choices that shaped the project.')}`),
    leaf(4,'Details',`<h2>A closer look.</h2>${placeholder('DESIGN & DEVELOPMENT','Space for interface details and implementation notes.')}${placeholder('ITERATIONS','Screenshots and changes will go here.')}`)
  ];
  return[
    leaf(5,'Outcome',`<h2>The outcome.</h2>${placeholder('THE FINAL WORK','The finished experience and results will go here.')}${placeholder('WHAT CHANGED','Space for the difference the project made.')}`),
    leaf(6,'Reflection',`<h2>Looking back.</h2>${placeholder('TAKEAWAYS','Lessons and reflections will go here.')}${placeholder('WHAT COMES NEXT','Space for improvements and next steps.')}`)
  ];
}
