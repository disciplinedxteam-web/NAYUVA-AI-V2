export async function dailyRequest(path:string,body?:unknown){
 const key=process.env['UDC_DAILY_API_KEY'],lovable=process.env['LOVABLE_API_KEY'];
 if(!key||!lovable)throw new Error('Daily is not connected. Ask the workspace owner to connect it.');
 const r=await fetch(`https://connector-gateway.lovable.dev/udc_daily/v1/${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${lovable}`,'X-Connection-Api-Key':key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const text=await r.text();let data:Record<string,unknown>={};try{data=JSON.parse(text);}catch{/* no JSON */}
 if(!r.ok){console.error('Daily request failed',r.status,text.slice(0,500));throw new Error(`Daily (${r.status}): ${String(data['info']??data['error']??'Video service unavailable').slice(0,250)}`);}
 return data;
}