import fs from 'node:fs';
import { createHash } from 'node:crypto';

const catalog=JSON.parse(fs.readFileSync('src/i18n/label-catalog.json','utf8'));
const keys={},translations={pt:{},en:{}};
for(const [raw,second,third] of catalog){
  const source=raw.replace(/\s+/g,' ').trim();
  const key=`ui_${createHash('sha256').update(source).digest('hex').slice(0,12)}`;
  if(keys[source])throw new Error(`Duplicate source: ${source}`);
  keys[source]=key;
  translations.pt[key]=(third===undefined?source:second).trim();
  translations.en[key]=(third===undefined?second:third).trim();
  if(source==='{{count}} passageiros aguardando no {{floor}}º andar'){
    translations.pt[`${key}_one`]='{{count}} passageiro aguardando no {{floor}}º andar';
    translations.pt[`${key}_other`]=translations.pt[key];
    translations.en[`${key}_one`]='{{count}} passenger waiting on floor {{floor}}';
    translations.en[`${key}_other`]=translations.en[key];
  }
}
fs.writeFileSync('src/i18n/label-keys.json',JSON.stringify(keys,null,2)+'\n');
for(const language of ['pt','en']){
  const file=`public/locales/${language}/translation.json`;
  const resources=JSON.parse(fs.readFileSync(file,'utf8'));
  resources.labels=translations[language];
  fs.writeFileSync(file,JSON.stringify(resources,null,2)+'\n');
}
console.log(`LABEL_CATALOG_SYNC_OK: ${catalog.length} entries in pt/en`);
