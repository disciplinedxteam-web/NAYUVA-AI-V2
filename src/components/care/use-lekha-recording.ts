import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { transcribeLekhaSegment } from '@/lib/care.functions';
function wav(samples: Float32Array, rate: number) {
 const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);const write=(offset:number,text:string)=>{for(let i=0;i<text.length;i++)v.setUint8(offset+i,text.charCodeAt(i));};
 write(0,'RIFF');v.setUint32(4,36+samples.length*2,true);write(8,'WAVE');write(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);write(36,'data');v.setUint32(40,samples.length*2,true);
 samples.forEach((x,i)=>v.setInt16(44+i*2,Math.max(-1,Math.min(1,x))*32767,true));const bytes=new Uint8Array(buffer);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(bin);
}
type Segment=NonNullable<Awaited<ReturnType<typeof transcribeLekhaSegment>>>;
export function useLekhaRecording(appointmentId:string,onSegment:(s:Segment)=>void){
 const transcribe=useServerFn(transcribeLekhaSegment),callback=useRef(onSegment);callback.current=onSegment;
 const [listening,setListening]=useState(false),[processing,setProcessing]=useState(false),[error,setError]=useState('');
 const engine=useRef<{context:AudioContext;stream:MediaStream;processor:ScriptProcessorNode}|null>(null),samples=useRef<Float32Array[]>([]),count=useRef(0),rate=useRef(16000),queue=useRef<{key:string;audio:string}[]>([]),work=useRef<Promise<void>|null>(null),blocked=useRef(false),mounted=useRef(true);
 async function drain(){if(work.current)return work.current; if(blocked.current||!queue.current.length)return;setProcessing(true);
 const task=(async()=>{while(queue.current.length&&!blocked.current){const chunk=queue.current[0];if(!chunk)break;try{const result=await transcribe({data:{appointmentId,...chunk}});queue.current.shift();if(result&&mounted.current)callback.current(result);}catch(e){blocked.current=true;if(mounted.current)setError(e instanceof Error?e.message:'Speech could not be recognized. Recording is paused; your captured audio is retained on this page.');engine.current?.processor.disconnect();engine.current?.stream.getTracks().forEach(t=>t.stop());void engine.current?.context.close();engine.current=null;if(mounted.current)setListening(false);}}})();work.current=task;await task;work.current=null;if(mounted.current)setProcessing(false);
 }
 function flush(){if(!count.current)return;const joined=new Float32Array(count.current);let offset=0;for(const s of samples.current){joined.set(s,offset);offset+=s.length;}samples.current=[];count.current=0;queue.current.push({key:crypto.randomUUID(),audio:wav(joined,rate.current)});void drain();}
 async function stop(){const e=engine.current;if(e){e.processor.disconnect();e.stream.getTracks().forEach(t=>t.stop());await e.context.close();engine.current=null;}setListening(false);flush();await work.current;return !blocked.current&&queue.current.length===0;}
 async function start(){if(engine.current||blocked.current)return;setError('');try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const context=new AudioContext();await context.resume();rate.current=context.sampleRate;const source=context.createMediaStreamSource(stream),processor=context.createScriptProcessor(4096,1,1);processor.onaudioprocess=e=>{const part=new Float32Array(e.inputBuffer.getChannelData(0));samples.current.push(part);count.current+=part.length;if(count.current>=rate.current*8)flush();};source.connect(processor);processor.connect(context.destination);engine.current={context,stream,processor};setListening(true);}catch{setError('Microphone access is unavailable. You can type the appointment notes.');}}
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;engine.current?.stream.getTracks().forEach(t=>t.stop());engine.current?.processor.disconnect();void engine.current?.context.close();};},[]);
 return {listening,processing,error,start,stop,retry:async()=>{blocked.current=false;setError('');flush();await drain();},hasPending:()=>queue.current.length>0||count.current>0};
}
