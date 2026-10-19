export type SutraAttachment = { id: string; name: string; text: string; preview?: string };
export async function extractSutraAttachment(file: File): Promise<SutraAttachment> {
 if(file.size > 10 * 1024 * 1024) throw new Error('Please choose files smaller than 10 MB.');
 let text = ''; let preview: string | undefined;
 if(file.type.startsWith('image/')) { preview = URL.createObjectURL(file); const { createWorker } = await import('tesseract.js'); const worker = await createWorker('eng'); try { text = (await worker.recognize(file)).data.text; } finally { await worker.terminate(); } }
 else if(file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) { const pdf = await import('pdfjs-dist'); const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url'); pdf.GlobalWorkerOptions.workerSrc = worker.default; const doc = await pdf.getDocument({data:await file.arrayBuffer()}).promise; try { for(let i=1;i<=Math.min(doc.numPages,30);i++) { const page=await doc.getPage(i); const content=await page.getTextContent(); text += content.items.map(x=>'str' in x?x.str:'').join(' ')+'\n'; } } finally {await doc.destroy();} }
 else if(/\.docx$/i.test(file.name)) { const mammoth=await import('mammoth/mammoth.browser'); text=(await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value; }
 else if(file.type.startsWith('text/') || /\.(txt|md|csv|json)$/i.test(file.name)) text=await file.text();
 else throw new Error('Use a photo, PDF, Word document or text file.');
 if(!text.trim()) { if(preview) URL.revokeObjectURL(preview); throw new Error('No readable text was found. Please attach a text-based record or type the relevant details.'); }
 return {id:crypto.randomUUID(),name:file.name,text:text.trim().slice(0,12000),preview};
}
