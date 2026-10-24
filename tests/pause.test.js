import test from 'node:test';
import assert from 'node:assert/strict';
import definition from '../module.js';
import {WorkStore} from '../core/store.js';

test('paused passes reject revived/cross-pass consumption while existing reservations can be settled', () => {
  const store=new WorkStore(definition);
  const save=(collection,data,id)=>{
    const result=store.transact({operation:'save',collection,data,id,revision:store.read().revision});
    return id||result.data[collection].at(-1).id;
  };
  const passData=(name,status)=>({name,units:3,expires:'2099-12-31',status});
  const visitData=(pass,lesson,status)=>({pass,lesson,date:'2099-10-25',status});
  const rejectUnchanged=(data,id)=>{
    const before=store.read(),events=store.db.prepare('SELECT COUNT(*) n FROM audit').get().n;
    assert.throws(()=>save('visits',data,id),/приостановлен|архивирован/);
    assert.deepEqual(store.read(),before,'Rejected change preserves saved data, balance and revision.');
    assert.equal(store.db.prepare('SELECT COUNT(*) n FROM audit').get().n,events,'Rejected change adds no successful audit event.');
  };
  try{
    const one=save('passes',passData('SYNTHETIC active then paused','active'));
    const two=save('passes',passData('SYNTHETIC paused destination','paused'));
    const cancelled=save('visits',visitData(one,'SYNTHETIC cancelled','cancelled'));
    const reserved=save('visits',visitData(one,'SYNTHETIC existing reservation','reserved'));
    save('passes',passData('SYNTHETIC active then paused','paused'),one);
    rejectUnchanged(visitData(one,'SYNTHETIC cancelled','reserved'),cancelled);
    rejectUnchanged(visitData(one,'SYNTHETIC cancelled','attended'),cancelled);
    rejectUnchanged(visitData(two,'SYNTHETIC existing reservation','reserved'),reserved);
    rejectUnchanged(visitData(two,'SYNTHETIC existing reservation','attended'),reserved);
    rejectUnchanged(visitData(one,'SYNTHETIC new reservation','reserved'));
    save('visits',visitData(one,'SYNTHETIC existing reservation','attended'),reserved);
    assert.equal(store.read().data.visits.find(v=>v.id===reserved).status,'attended');
    assert.throws(()=>save('visits',visitData(one,'SYNTHETIC existing reservation','cancelled'),reserved),/нельзя менять/);
    const restored=new WorkStore(definition);
    try{
      restored.restore(store.export());
      assert.deepEqual(restored.read().data,store.read().data,'Paused pass history survives a validated restore.');
      assert.throws(()=>restored.transact({operation:'save',collection:'visits',id:cancelled,revision:restored.read().revision,data:visitData(one,'SYNTHETIC cancelled','reserved')}),/приостановлен|архивирован/);
    }finally{restored.close();}
    save('passes',passData('SYNTHETIC active again','active'),one);
    save('visits',visitData(one,'SYNTHETIC cancelled','reserved'),cancelled);
    assert.equal(store.read().data.visits.find(v=>v.id===cancelled).status,'reserved');
  }finally{store.close();}
});
