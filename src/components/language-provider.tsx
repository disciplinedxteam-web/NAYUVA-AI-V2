import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const languages = [
  {code:'en',name:'English'}, {code:'hi',name:'हिन्दी (Hindi)'}, {code:'bn',name:'বাংলা (Bengali)'},
  {code:'gu',name:'ગુજરાતી (Gujarati)'}, {code:'kn',name:'ಕನ್ನಡ (Kannada)'}, {code:'ml',name:'മലയാളം (Malayalam)'},
  {code:'mr',name:'मराठी (Marathi)'}, {code:'or',name:'ଓଡ଼ିଆ (Odia)'}, {code:'pa',name:'ਪੰਜਾਬੀ (Punjabi)'},
  {code:'ta',name:'தமிழ் (Tamil)'}, {code:'te',name:'తెలుగు (Telugu)'},
];
const localeFiles = import.meta.glob<Record<string,string>>('../lib/locales/*.json', {import:'default'});
const LanguageContext = createContext({language:'en',setLanguage:(_language:string)=>{},error:''});
export function useLanguage(){ return useContext(LanguageContext); }

/** Static interface dictionaries only: patient records and conversations are never sent for translation. */
export function LanguageProvider({children}:{children:ReactNode}) {
  const [language,setLanguageState] = useState('en'); const [error,setError] = useState('');
  const [dictionary,setDictionary] = useState<Record<string,string>>({});
  useEffect(()=>{ const saved=localStorage.getItem('nayuva-language'); if(saved&&languages.some(l=>l.code===saved))setLanguageState(saved); },[]);
  useEffect(()=>{
    let active=true; setError('');
    if(language==='en'){setDictionary({});return;}
    const load=localeFiles[`../lib/locales/${language}.json`];
    if(!load){setDictionary({});setError('This translation is not available yet.');return;}
    void load().then(d=>{if(active)setDictionary(d);}).catch(()=>{if(active)setError('Translation could not be loaded.');});
    return ()=>{active=false;};
  },[language]);
  useEffect(()=>{
    document.documentElement.lang=language;
    const originals=new Map<Text,{source:string;translated:string}>(); const attributes=new Map<Element,Map<string,{source:string;translated:string}>>();
    function translate(source:string){ const key=source.trim().replace(/\s+/g,' '); const value=dictionary[key]; return value?source.replace(source.trim(),value):source; }
    function update(){
      observer.disconnect();
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let node=walker.nextNode();
      while(node){
        const text=node as Text; const parent=text.parentElement;
        if(parent&&!parent.closest('script,style,[data-no-translate],.profile-results,.profile-selected,.chat-bubble,blockquote')){
          const old=originals.get(text); const source=old&&text.data===old.translated?old.source:text.data;
          const translated=translate(source); if(translated!==text.data)text.data=translated;
          originals.set(text,{source,translated});
        }
        node=walker.nextNode();
      }
      document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el=>{
        if(el.closest('[data-no-translate]'))return;
        for(const attr of ['placeholder','aria-label','title']){
          const current=el.getAttribute(attr); if(current===null)continue;
          const saved=attributes.get(el)??new Map(); const old=saved.get(attr); const source=old&&current===old.translated?old.source:current; const translated=translate(source);
          if(translated!==current)el.setAttribute(attr,translated); saved.set(attr,{source,translated});attributes.set(el,saved);
        }
      });
      observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
    }
    const observer=new MutationObserver(update);update();
    return ()=>{observer.disconnect(); originals.forEach((v,n)=>{if(n.data===v.translated)n.data=v.source;});attributes.forEach((map,el)=>map.forEach((v,k)=>{if(el.getAttribute(k)===v.translated)el.setAttribute(k,v.source);}));};
  },[dictionary,language]);
  function setLanguage(code:string){localStorage.setItem('nayuva-language',code);setLanguageState(code);}
  return <LanguageContext.Provider value={{language,setLanguage,error}}>{children}</LanguageContext.Provider>;
}
export function LanguageMenu(){
  const {language,setLanguage,error}=useLanguage();
  return <div data-no-translate><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" aria-label="Choose language" title="Choose language"><Languages/><ChevronDown size={12}/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="nv-select-menu">{languages.map(l=><DropdownMenuItem key={l.code} onSelect={()=>setLanguage(l.code)}>{l.code===language&&<Check/>}{l.name}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>{error&&<span role="status" className="text-xs text-destructive">{error}</span>}</div>;
}