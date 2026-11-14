import {validateRangeSettings} from './exam-ranges.js';
export const STORAGE_KEY='study-shelf.progress.v1';
export const statuses={unknown:'未確認',todo:'未着手',doing:'途中',done:'完了',skip:'対象外'};
export const emptyRecord=()=>({status:'unknown',note:''});
export function recordOf(records,id){return records[id]||emptyRecord();}
export function counts(units,records){const n={unknown:0,todo:0,doing:0,done:0,skip:0};for(const u of units)n[recordOf(records,u.id).status]++;return {...n,remaining:n.todo+n.doing,total:units.length,active:units.length-n.skip};}
export function matchesMode(n,mode){return mode==='all'||(mode==='open'&&n.remaining+n.unknown>0)||(mode==='doing'&&n.doing>0)||(mode==='done'&&n.done>0)||(mode==='unknown'&&n.unknown>0);}
export function updateRecords(records,ids,change){const next={...records};for(const id of ids){next[id]={...recordOf(records,id),...change};}return next;}
export function throughIds(book,lastId){const index=book.units.findIndex(u=>u.id===lastId);if(index<0)throw new Error('単元が見つかりません');return book.units.slice(0,index+1).map(u=>u.id);}
export function validateBackup(value,catalog){
  if(!value||value.schemaVersion!==1||value.catalogId!==catalog.id||!value.records||typeof value.records!=='object'||Array.isArray(value.records))throw new Error('このアプリのバックアップではありません。');
  const ids=new Set(catalog.books.flatMap(b=>b.units.map(u=>u.id)));const clean={};let ignored=0;
  for(const [id,r] of Object.entries(value.records)){
    if(!ids.has(id)){ignored++;continue;}
    if(!r||typeof r!=='object'||!Object.hasOwn(statuses,r.status)||typeof r.note!=='string'||r.note.length>1000)throw new Error('進捗データの形式が正しくありません。');
    clean[id]={status:r.status,note:r.note};
  }
  const result={records:clean,ignored};
  if(value.rangeSettings!==undefined)result.rangeSettings=validateRangeSettings(value.rangeSettings,catalog);
  return result;
}
export function makeBackup(records,catalog,rangeSettings){return {schemaVersion:1,catalogId:catalog.id,exportedAt:new Date().toISOString(),records,...(rangeSettings?{rangeSettings}:{})};}
