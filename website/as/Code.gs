/**
 * 로보링크 AS 현황 서버 (구글 앱스 스크립트)
 * 1) 구글 시트를 새로 만들고 확장 프로그램 > Apps Script 에 이 코드를 붙여넣기
 * 2) 프로젝트 설정 > 스크립트 속성에 STAFF_CODES 추가
 *    예) 김:kim2026,이:lee2026   (이름:코드, 쉼표로 구분)
 * 3) 배포 > 새 배포 > 웹 앱 (실행: 나 / 액세스: 모든 사용자) 후 URL 복사
 */
const HEAD=['id','name','phone','product','symptom','status','carrier','tracking','note','created','updated','by'];
const STATUS=['received','arrived','repairing','shipped'];

function sheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let sh=ss.getSheetByName('AS');
  if(!sh){sh=ss.insertSheet('AS');sh.appendRow(HEAD);sh.setFrozenRows(1);}
  return sh;
}
function staff_(code){
  const list=(PropertiesService.getScriptProperties().getProperty('STAFF_CODES')||'').split(',');
  for(const x of list){const [n,c]=x.trim().split(':');if(c&&c===String(code||'').trim())return n;}
  return null;
}
function rows_(){
  const v=sheet_().getDataRange().getValues();v.shift();
  return v.map((r,i)=>{const o={_row:i+2};HEAD.forEach((h,j)=>o[h]=r[j]instanceof Date?r[j].toISOString():String(r[j]));return o;});
}
function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function pub_(o){const {_row,phone,by,...rest}=o;return rest;}

function doPost(e){
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const q=JSON.parse(e.postData.contents),now=new Date().toISOString();
    if(q.action==='lookup'){ // 고객: 접수번호 + 전화번호 뒤 4자리
      const id=String(q.id||'').trim().toUpperCase(),p4=String(q.phone4||'').replace(/\D/g,'');
      const r=rows_().find(o=>o.id.toUpperCase()===id&&p4.length===4&&o.phone.slice(-4)===p4);
      return out_(r?{ok:true,item:pub_(r)}:{ok:false,error:'일치하는 접수 내역이 없어요.'});
    }
    const who=staff_(q.code);
    if(!who)return out_({ok:false,error:'코드가 올바르지 않아요.'});
    if(q.action==='login')return out_({ok:true,name:who});
    if(q.action==='list')return out_({ok:true,items:rows_().reverse().map(o=>{const {_row,...r}=o;return r;})});
    const sh=sheet_();
    if(q.action==='create'){
      const d=Utilities.formatDate(new Date(),'Asia/Seoul','yyMMdd'),n=rows_().filter(o=>o.id.indexOf('AS-'+d)===0).length+1;
      const id='AS-'+d+'-'+('00'+n).slice(-3),phone=String(q.phone||'').replace(/\D/g,'');
      if(!q.name||phone.length<4||!q.product)return out_({ok:false,error:'이름, 연락처, 제품은 필수예요.'});
      sh.appendRow([id,q.name,"'"+phone,q.product,q.symptom||'',q.status||'received','','',q.note||'',now,now,who]);
      return out_({ok:true,id:id});
    }
    if(q.action==='update'){
      const r=rows_().find(o=>o.id===q.id);if(!r)return out_({ok:false,error:'접수번호를 찾을 수 없어요.'});
      if(STATUS.indexOf(q.status)<0)return out_({ok:false,error:'상태 값이 올바르지 않아요.'});
      if(q.status==='shipped'&&(!q.carrier||!q.tracking))return out_({ok:false,error:'발송 완료는 택배사와 송장번호가 필요해요.'});
      sh.getRange(r._row,6,1,3).setValues([[q.status,q.carrier||'',"'"+(q.tracking||'')]]);
      sh.getRange(r._row,9).setValue(q.note||'');
      sh.getRange(r._row,11).setValue(now);sh.getRange(r._row,12).setValue(who);
      return out_({ok:true});
    }
    return out_({ok:false,error:'알 수 없는 요청이에요.'});
  }catch(err){return out_({ok:false,error:'서버 오류: '+err});}
  finally{lock.releaseLock();}
}
