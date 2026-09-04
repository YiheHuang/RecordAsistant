import fs from 'node:fs';

const targets=await (await fetch('http://127.0.0.1:9224/json')).json();
const page=targets.find(item=>item.type==='page');
if(!page) throw new Error('No browser page found');
const ws=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
let sequence=0;const pending=new Map();
ws.addEventListener('message',event=>{const message=JSON.parse(String(event.data));if(message.id&&pending.has(message.id)){pending.get(message.id)(message);pending.delete(message.id)}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,message=>message.error?reject(new Error(message.error.message)):resolve(message.result));ws.send(JSON.stringify({id,method,params}))});
const evaluate=expression=>call('Runtime.evaluate',{expression,returnByValue:true});
await call('Page.enable');
await call('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});
for(let i=0;i<30;i++){const ready=await evaluate("document.querySelector('.app-shell')?.textContent.includes('RecordAssistant')");if(ready.result.value)break;await new Promise(resolve=>setTimeout(resolve,150))}
fs.mkdirSync('docs/images',{recursive:true});
const dashboard=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
fs.writeFileSync('docs/images/dashboard.png',Buffer.from(dashboard.data,'base64'));
await evaluate("[...document.querySelectorAll('.nav-item')].find(x=>x.textContent.includes('关系图谱'))?.click()");
await new Promise(resolve=>setTimeout(resolve,300));
await evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent.includes('自动排版'))?.click()");
await new Promise(resolve=>setTimeout(resolve,700));
const relationships=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
fs.writeFileSync('docs/images/relationships.png',Buffer.from(relationships.data,'base64'));
console.log(await (await evaluate("JSON.stringify({brand:document.body.innerText.includes('RecordAssistant'),autoLayout:document.body.innerText.includes('自动排版'),nodes:document.querySelectorAll('.react-flow__node').length,edges:document.querySelectorAll('.react-flow__edge').length})")).result.value);
ws.close();
