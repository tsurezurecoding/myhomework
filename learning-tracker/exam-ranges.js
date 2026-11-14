// 学校配布の2026年2学期期末範囲表と既存目次の対応。
// ページの一致と単元名の一致を区別し、対応を断定できないものは要確認。
export const EXAM_ID='2026-term2-final';
export const RANGE_STORAGE_KEY='study-shelf.exam-ranges.v1';
export const rangeLabels={in:'範囲内',partial:'一部が範囲',review:'要確認',out:'範囲外'};
const preset={};
function set(ids,status,note){for(const id of ids.split(' '))preset[id]={status,note};}
set('w-english-9','partial','本誌 p.52〜57のみ（単元全体はp.48〜57）。');
set('w-english-10 w-english-11 w-english-12','in','本誌 p.58〜75。学校指定はp.52〜83。');
set('w-english-13','partial','本誌 p.76〜83のみ（単元全体はp.76〜85）。付属ノートはp.42の大問6まで。');
set('w-science-9 w-science-10','in','理科1のワーク p.62〜74。');
set('w-science-4','partial','理科2：p.27の2、p.29の4のみ。');
set('w-science-5','partial','理科2：p.30〜35。ただしp.32の2は範囲外。');
set('c10-math-2 t2-math-4','in','4章「比例と反比例」に対応。学校指定は教科書p.117〜156、授業プリント4章②〜⑯。');
set('c10-math-3','partial','赤ペンのうち比例・反比例に対応する問題。方程式は今回の範囲表に記載なし。');
set('c11-math-1','in','比例と反比例の単元に対応。');
set('c11-math-3 c11-math-4','partial','比例・反比例の問題のみ。平面図形は範囲表に記載なし。');
set('c9-english-1 c9-english-2 c10-english-1 c10-english-2 t1-english-6 t1-english-7 t2-english-2 t2-english-3','in','範囲表にあるLesson 5・6の対策。');
set('c11-english-1 c11-english-2 t2-english-4','partial','Lesson 7 Part 1「過去形に慣れる」に対応する部分のみ。Lesson 7全体ではありません。');
set('c10-japanese-1 c11-japanese-1 t2-japanese-4 t2-japanese-6 t2-japanese-7','in','「言葉」をもつ鳥、シジュウカラ／いろは歌／蓬萊の玉の枝のうち、該当する作品の対策。');
set('c10-japanese-3 c11-japanese-3','partial','範囲内の作品に対応する添削問題のみ。');
set('t2-japanese-14','partial','接続詞・感動詞・形容詞に対応する部分。漢字は学校指定p.50〜69との対応を確認。');
set('c-science-strata-1 c-science-strata-2','review','範囲表の理科2は教科書p.81〜95・ワークp.27の2、p.29の4、p.30〜35。地層のチャレンジとの対応は原紙だけでは確定できません。');
set('c-geography-1 c-geography-2 c-geography-3 c-geography-4 t-geography-4','review','地理は教科書p.64〜77・学校ワーク本体p.46〜51。アジア州／ヨーロッパ州などの対応は教科書で確認してください。');
set('c-history-ancient-1 c-history-ancient-2 c-history-medieval-1 c-history-medieval-2 t-history-1 t-history-2 t-history-3 t-history-4','review','歴史は教科書p.42〜85。学校ワーク本体p.20〜29・34〜41。教材が異なるため、単元の境界を教科書で確認してください。');

export function rangeOf(unit,overrides={}){
  const initial=preset[unit.id]||{status:'out',note:'今回の範囲表に対応する項目なし。'};
  return {...initial,status:overrides[unit.id]||initial.status,custom:Object.hasOwn(overrides,unit.id)};
}
export function unitsInRange(book,scope,overrides={}){
  return scope==='all'?book.units:book.units.filter(unit=>rangeOf(unit,overrides).status!=='out');
}
export function validateRangeSettings(value,catalog){
  if(!value||value.examId!==EXAM_ID||!value.overrides||typeof value.overrides!=='object'||Array.isArray(value.overrides))throw new Error('範囲設定の形式が正しくありません。');
  const known=new Set(catalog.books.flatMap(b=>b.units.map(u=>u.id))),overrides={};
  for(const [id,status] of Object.entries(value.overrides)){
    if(!known.has(id))continue;
    if(!Object.hasOwn(rangeLabels,status))throw new Error('範囲設定の値が正しくありません。');
    overrides[id]=status;
  }
  return {examId:EXAM_ID,overrides};
}
export const defaultRangeIds=Object.keys(preset);
