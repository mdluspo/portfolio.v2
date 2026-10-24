import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const sources=fs.readdirSync(new URL('src/',root),{recursive:true})
  .filter(file=>/\.(js|css)$/.test(file)).map(file=>'src/'+file);

test('page entry points and static artwork references resolve to existing files',()=>{
  const html=fs.readFileSync(new URL('index.html',root),'utf8');
  for(const [,path] of html.matchAll(/(?:src|href)="(\/src\/[^"?]+)(?:\?[^" ]*)?"/g)){
    assert.ok(fs.existsSync(new URL(path.slice(1),root)),path);
  }
  for(const file of ['index.html',...sources]){
    const source=fs.readFileSync(new URL(file,root),'utf8');
    const paths=new Set(source.match(/\/(?:assets|documents)\/[\w./-]+\.(?:png|jpg|jpeg|svg|webp|ttf|pdf)/g)||[]);
    for(const path of paths)assert.ok(fs.existsSync(new URL('public'+path,root)),`${file}: ${path}`);
  }
});

test('source modules import files from the organized source tree',()=>{
  for(const file of sources.filter(file=>file.endsWith('.js'))){
    const url=new URL(file,root);
    for(const [,specifier] of fs.readFileSync(url,'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)){
      if(specifier.startsWith('.'))assert.ok(fs.existsSync(new URL(specifier.split('?')[0],url)),`${file}: ${specifier}`);
    }
  }
});
