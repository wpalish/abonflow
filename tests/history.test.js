import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import definition from '../module.js';
import {WorkStore} from '../core/store.js';
const save=(s,collection,data,id)=>{const n=s.transact({operation:'save',collection,data,id,revision:s.read().revision});return id||n.data[collection].at(-1).id;};
const audit=s=>s.db.prepare('SELECT * FROM audit ORDER BY rowid').all();
function denied(s,action,pattern=/архивирован|Сначала|нельзя менять/){const before=s.read(),events=audit(s);assert.throws(action,pattern);assert.deepEqual(s.read(),before);assert.deepEqual(audit(s),events);}
function fixture(s){
  const pass=save(s,'passes',{name:'SYNTHETIC history',units:3,expires:'2099-12-31',status:'active'}),live=save(s,'passes',{name:'SYNTHETIC live',units:4,expires:'2099-12-31',status:'active'});
  const fields={pass,lesson:'SYNTHETIC cancelled',date:'2099-10-25',status:'cancelled'},id=save(s,'visits',fields);
  const attended=save(s,'visits',{...fields,lesson:'SYNTHETIC attended',status:'attended'});
  s.transact({operation:'archive',collection:'passes',id:pass,revision:s.read().revision});
  return {pass,live,fields,id,attended};
}
test('cancelled history can be corrected without consumption; archived passes still reject new/reopened/retargeted consumption',()=>{
  const s=new WorkStore(definition);try{
    const f=fixture(s),passes=s.read().data.passes,balances=s.read().computed;
    denied(s,()=>save(s,'visits',{...f.fields,status:'reserved'},f.id));
    denied(s,()=>save(s,'visits',{...f.fields,status:'attended'},f.id));
    denied(s,()=>save(s,'visits',{...f.fields,lesson:'SYNTHETIC new',status:'reserved'}));
    const active=save(s,'visits',{...f.fields,pass:f.live,lesson:'SYNTHETIC active',status:'reserved'});
    denied(s,()=>save(s,'visits',{...f.fields,lesson:'SYNTHETIC active',status:'reserved'},active));
    denied(s,()=>s.transact({operation:'archive',collection:'passes',id:f.live,revision:s.read().revision}));
    const before=s.read().data.visits.find(v=>v.id===f.attended);
    denied(s,()=>save(s,'visits',{...f.fields,lesson:'SYNTHETIC changed attended',status:'attended'},f.attended));
    save(s,'visits',{...f.fields,lesson:'SYNTHETIC corrected cancellation',date:'2099-10-24'},f.id);
    assert.deepEqual(s.read().data.passes,passes);
    assert.deepEqual(s.read().computed[0],balances[0]);
    assert.deepEqual(s.read().data.visits.find(v=>v.id===f.attended),before);
    assert.equal(s.read().data.visits.find(v=>v.id===f.id).status,'cancelled');
    // Explicit correction of cancelled links is allowed by the existing domain rules.
    save(s,'visits',{...f.fields,pass:f.live},f.id);
    assert.equal(s.read().data.visits.find(v=>v.id===f.id).pass,f.live);
    assert.deepEqual(s.read().computed[0],balances[0]);
  }finally{s.close();}
});
test('file restart and empty restore retain archived pass/cancelled visit and balances',()=>{
  const dir=mkdtempSync(join(tmpdir(),'abonflow-history-')),path=join(dir,'workspace.sqlite');
  let s=new WorkStore(definition,path);const restored=new WorkStore(definition);try{
    const f=fixture(s),before=s.read(),events=audit(s),copy=s.export();s.close();s=new WorkStore(definition,path);
    assert.deepEqual(s.read(),before);assert.deepEqual(audit(s),events);
    restored.restore(copy);assert.deepEqual(restored.read().data,before.data);assert.deepEqual(restored.read().computed,before.computed);
    denied(restored,()=>save(restored,'visits',{...f.fields,status:'reserved'},f.id));
    save(restored,'visits',{...f.fields,lesson:'SYNTHETIC restored cancellation'},f.id);
    assert.equal(restored.read().data.visits.find(v=>v.id===f.id).pass,f.pass);
    assert.equal(restored.read().data.visits.find(v=>v.id===f.id).status,'cancelled');
    assert.deepEqual(restored.read().computed,before.computed);
  }finally{s.close();restored.close();rmSync(dir,{recursive:true,force:true});}
});
