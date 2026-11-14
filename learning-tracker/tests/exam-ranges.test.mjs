import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalog} from '../catalog.js';
import {EXAM_ID,rangeOf,unitsInRange,validateRangeSettings,defaultRangeIds} from '../exam-ranges.js';
import {counts,throughIds,updateRecords,makeBackup,validateBackup} from '../model.js';
const book=id=>catalog.books.find(b=>b.id===id);
const unit=id=>catalog.books.flatMap(b=>b.units).find(u=>u.id===id);

test('期末プリセットは既存単元だけを参照し、部分ページ・範囲外を区別する',()=>{
  for(const id of defaultRangeIds)assert.ok(unit(id),id);
  assert.equal(rangeOf(unit('w-english-9')).status,'partial');
  assert.match(rangeOf(unit('w-english-9')).note,/52〜57/);
  assert.equal(rangeOf(unit('w-english-13')).status,'partial');
  assert.match(rangeOf(unit('w-english-13')).note,/76〜83/);
  assert.deepEqual(unitsInRange(book('w-english'),'exam').map(u=>u.id),['w-english-9','w-english-10','w-english-11','w-english-12','w-english-13']);
  assert.deepEqual(unitsInRange(book('w-science'),'exam').map(u=>u.id),['w-science-4','w-science-5','w-science-9','w-science-10']);
  assert.match(rangeOf(unit('w-science-5')).note,/p\.32の2は範囲外/);
  assert.equal(rangeOf(unit('c11-math-2')).status,'out');
  assert.equal(rangeOf(unit('t2-english-4')).status,'partial');
  assert.equal(rangeOf(unit('c-geography-1')).status,'review');
  assert.equal(rangeOf(unit('c-history-medieval-1')).status,'review');
});

test('範囲変更は進捗を変えず、集計と一括完了から範囲外を除く',()=>{
  const b=book('w-english'),overrides={'w-english-10':'out','w-english-1':'in'};
  const scoped=unitsInRange(b,'exam',overrides);
  assert.ok(scoped.some(u=>u.id==='w-english-1'));
  assert.ok(!scoped.some(u=>u.id==='w-english-10'));
  assert.equal(unitsInRange(b,'all',overrides).length,b.units.length);
  const records={'w-english-10':{status:'done',note:'既存記録'},'w-english-9':{status:'doing',note:'p.54まで'}};
  assert.equal(counts(scoped,records).done,0);
  const next=updateRecords(records,throughIds({...b,units:scoped},'w-english-11'),{status:'done'});
  assert.deepEqual(next['w-english-10'],records['w-english-10']);
  assert.equal(next['w-english-9'].note,'p.54まで');
  assert.equal(next['w-english-8'],undefined);
  assert.equal(records['w-english-9'].status,'doing');
});

test('範囲設定入り・従来のバックアップを復元し、不正な設定を拒否する',()=>{
  const records={'w-english-9':{status:'doing',note:'p.54まで'}};
  const settings={examId:EXAM_ID,overrides:{'w-english-9':'out','w-english-10':'partial'}};
  const backup=makeBackup(records,catalog,settings),restored=validateBackup(JSON.parse(JSON.stringify(backup)),catalog);
  assert.deepEqual(restored.records,records);assert.deepEqual(restored.rangeSettings,settings);
  assert.equal(validateBackup(makeBackup(records,catalog),catalog).rangeSettings,undefined);
  assert.throws(()=>validateBackup({...backup,rangeSettings:{...settings,overrides:{'w-english-9':'done'}}},catalog));
  assert.throws(()=>validateRangeSettings({examId:'wrong',overrides:{}},catalog));
  assert.throws(()=>validateRangeSettings({examId:EXAM_ID,overrides:[]},catalog));
  assert.deepEqual(validateRangeSettings({examId:EXAM_ID,overrides:{deleted:'in'}},catalog).overrides,{});
});
