const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.pdf':'application/pdf','.mp3':'audio/mpeg','.mp4':'video/mp4','.mov':'video/quicktime','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
 let file;
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''))}
 catch{res.writeHead(400);res.end();return}
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.stat(file,(error,stat)=>{
   if(error||!stat.isFile()){res.writeHead(404);res.end();return}
   const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
   let start=0,end=stat.size-1,code=200;
   if(req.headers.range){
     const match=/^bytes=([0-9]*)-([0-9]*)$/.exec(req.headers.range);
     if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':'bytes */'+stat.size});res.end();return}
     start=match[1]?Number(match[1]):Math.max(0,stat.size-Number(match[2]));
     end=match[1]&&match[2]?Math.min(Number(match[2]),stat.size-1):stat.size-1;
     if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':'bytes */'+stat.size});res.end();return}
     code=206;headers['Content-Range']='bytes '+start+'-'+end+'/'+stat.size;
   }
   headers['Content-Length']=end-start+1;res.writeHead(code,headers);
   if(req.method==='HEAD'){res.end();return}
   const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 });
}).listen(Number(process.env.PORT)||4174,'127.0.0.1',()=>console.log('Video preview ready'));
