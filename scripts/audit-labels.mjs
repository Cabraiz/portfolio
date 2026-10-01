import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const catalog=JSON.parse(fs.readFileSync('src/i18n/label-catalog.json','utf8'));
const keys=JSON.parse(fs.readFileSync('src/i18n/label-keys.json','utf8'));
const resources=Object.fromEntries(['pt','en'].map(language=>[language,JSON.parse(fs.readFileSync(`public/locales/${language}/translation.json`,'utf8'))]));
const failures=[];
const normal=value=>value.replace(/\s+/g,' ').trim();
const tokens=value=>[...value.matchAll(/{{\s*(\w+)\s*}}/g)].map(m=>m[1]).sort().join(',');
function leaves(value,prefix=''){
 const output={};for(const [key,child] of Object.entries(value)){
  const name=prefix?`${prefix}.${key}`:key;
  if(child&&typeof child==='object')Object.assign(output,leaves(child,name));else output[name]=child;
 }return output;
}
const pt=leaves(resources.pt),en=leaves(resources.en);
for(const key of new Set([...Object.keys(pt),...Object.keys(en)])){
 if(typeof pt[key]!=='string'||typeof en[key]!=='string'||!pt[key].trim()||!en[key].trim())failures.push(`${key}: missing/non-text translation`);
 else if(tokens(pt[key])!==tokens(en[key]))failures.push(`${key}: interpolation mismatch`);
}
const references=new Map(),resourceReferences=new Map(),neutral=new Map(),rawUi=[];
const neutralLabels=new Set(['Mateus Cabral','Mateus Cabraiz','Cabraiz','Logo','WhatsApp','MEET','Dev','Fortaleza','MS','×','Cabraiz Drive','CABRAIZ DRIVE','Cabraiz Elevator','Cabraiz Arcade']);
const roots=['src/pages/Mateus','src/App/NavBar','src/features/navigation'];
function files(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(root,entry.name)):/\.(ts|tsx)$/.test(entry.name)?[path.join(root,entry.name)]:[]);}
const sourceFiles=[...roots.flatMap(files),'src/App/App.tsx','src/routes/AppRoutes.tsx','src/i18n/LoadingStatus.tsx'].filter(file=>!/[/\\](RoadMap|Live|Technologies)[/\\]/.test(file));
for(const file of sourceFiles){
 const source=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const visit=node=>{
  if(ts.isStringLiteral(node)||ts.isJsxText(node)){
   const text=normal(node.text);
   if(keys[text]){if(!references.has(text))references.set(text,[]);references.get(text).push(`${file.replaceAll('\\','/')}:${tree.getLineAndCharacterOfPosition(node.getStart(tree)).line+1}`);}
   for(const resourceKey of Object.keys(pt).filter(key=>key===text||key.startsWith(`${text}.`))){
    if(!resourceReferences.has(resourceKey))resourceReferences.set(resourceKey,[]);
    resourceReferences.get(resourceKey).push(`${file.replaceAll('\\','/')}:${tree.getLineAndCharacterOfPosition(node.getStart(tree)).line+1}`);
   }
  }
  if(ts.isCallExpression(node)&&node.expression.getText(tree)==='localizeLabel'&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0])){
   const text=normal(node.arguments[0].text);
   if(!keys[text]&&/[A-Za-zÀ-ÿ]/.test(text)){
    if(!neutralLabels.has(text))failures.push(`${file}: unmapped presentation string ${text}`);
    else{if(!neutral.has(text))neutral.set(text,[]);neutral.get(text).push(file.replaceAll('\\','/'));}
   }
  }
  if(ts.isJsxText(node)&&/[A-Za-zÀ-ÿ]/.test(node.text)&&!file.includes('components/mobile/game/homeGame'))rawUi.push({file,text:normal(node.text)});
  ts.forEachChild(node,visit);
 };visit(tree);
}
// Legacy Home variants remain in the source tree but are not imported by the public router.
const connectedFiles=sourceFiles.filter(file=>fs.readFileSync(file,'utf8').includes('useLabelLanguage'));
for(const row of rawUi)if(connectedFiles.includes(row.file))failures.push(`${row.file}: raw JSX text ${row.text}`);
const rows=[['key','source','pt-BR','en-US','classification','references']];
const seen=new Set();
for(const [raw,second,third] of catalog){
 const source=normal(raw),key=`ui_${createHash('sha256').update(source).digest('hex').slice(0,12)}`;
 if(seen.has(source))failures.push(`Duplicate catalog source: ${source}`);seen.add(source);
 const portuguese=third===undefined?source:second.trim(),english=third===undefined?second.trim():third.trim();
 if(keys[source]!==key||resources.pt.labels[key]!==portuguese||resources.en.labels[key]!==english)failures.push(`${source}: generated catalog out of sync`);
 rows.push([`labels.${key}`,source,portuguese,english,'localized',(references.get(source)??[]).join(' | ')]);
}
for(const [text,locations] of neutral)rows.push(['',text,text,text,'proper-name-or-symbol',[...new Set(locations)].join(' | ')]);
const mappedKeys=new Set(Object.values(keys).map(key=>`labels.${key}`));
for(const resourceKey of Object.keys(pt).filter(key=>!mappedKeys.has(key))){
 rows.push([resourceKey,pt[resourceKey],pt[resourceKey],en[resourceKey],resourceKey.startsWith('labels.')?'localized-plural':'localized-resource',(resourceReferences.get(resourceKey)??[]).join(' | ')]);
}
const csv=rows.map(row=>row.map(cell=>`"${String(cell).replaceAll('"','""')}"`).join(',')).join('\n')+'\n';
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/label-map.csv','\uFEFF'+csv);
const summary={languages:['pt-BR','en-US'],catalogEntries:catalog.length,resourceLeaves:Object.keys(pt).length,connectedFiles:connectedFiles.length,neutralLabels:neutral.size,missing:failures,review:'Idiomatic English reviewed by Codex; no human native-speaker certification',scope:'Public portfolio and standalone games. Inactive RoadMap/Live/Technologies variants excluded.',assets:'Proper names, company logos, project screenshots and text baked into artwork retain their original language.'};
fs.writeFileSync('reports/label-map-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
if(failures.length)process.exitCode=1;
