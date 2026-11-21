import test from 'node:test';
import assert from 'node:assert/strict';
import {basicReply,understand} from '../commerce/shop-conversation.mjs';
import {conversation} from '../server/shop-conversation.mjs';
const user=content=>({role:'user',content});
const chat=[user('How much is iPhone 13?'),user('Can you do 300k?')];
test('budget, model, alternative and condition follow-ups',()=>{
 assert.equal(understand(chat).budget,300000);assert.equal(understand(chat).device,'iphone 13');
 assert.equal(basicReply(chat,[],true).escalate,true);
 assert.deepEqual(understand([...chat,user('What else can I get brand new?')]),{budget:300000,device:'',condition:'Brand New'});
});
test('free mode does not call an AI and handoff requires consent',async()=>{
 const deps={items:[],available:false,take:()=>{throw Error('unexpected paid call');}};
 assert.equal((await conversation({action:'chat',messages:chat},deps))[1].mode,'catalogue');
 assert.equal((await conversation({action:'handoff',messages:chat},deps))[0],400);
});
