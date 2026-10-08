// Claude Farm — procedural 16-bit world engine (canvas)
const W = 960, H = 640;
const P = {
  out:'#2a1d1a',
  g0:'#2d5e33', g1:'#3c7d3a', g2:'#55a046', g3:'#6cb651', g4:'#94d066',
  d0:'#5e3b22', d1:'#87582f', d2:'#ad7843', d3:'#cb9d62', d4:'#e5c58e',
  w0:'#3b2216', w1:'#5c3720', w2:'#7f4f2c', w3:'#a46b3b', w4:'#c98f52', w5:'#e0b27a',
  r0:'#7a2f17', r1:'#a8441f', r2:'#d0632c', r3:'#ec8744', r4:'#f6ad68',
  s0:'#3e4150', s1:'#5d6070', s2:'#878a99', s3:'#b5b8c3', s4:'#e0e2e8',
  b0:'#24508a', b1:'#2c66a0', b2:'#428bc8', b3:'#76b9e6', b4:'#c2ebfa',
  sl0:'#2b3555', sl1:'#3c4d7e', sl2:'#566ca3', sl3:'#7b93c6',
  t0:'#1d4d52', t1:'#2a6d73', t2:'#3d8e91', t3:'#63b4ae',
  br0:'#5e2422', br1:'#86342c', br2:'#ad4a3a', br3:'#cc6a55',
  cream:'#f3e2b8', cream2:'#e3c98f', plaster:'#efdfbd', plaster2:'#d8c49c',
  glow:'#ffd77a', labglow:'#8ff0c4', gold:'#f0cf6a', hay:'#e0b84f', hayD:'#b98c34'
};
const BAY = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v => v / 16);
const by = (x, y) => BAY[(y & 3) * 4 + (x & 3)];
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(x,y,s){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,982451653))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function noise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return [c,g]}
const painter = g => (x,y,w,h,c) => { g.fillStyle = c; g.fillRect(x,y,w,h); };
function hexRgb(h){const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255]}
function silhouette(src,col){const [c,g]=mk(src.width,src.height);g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,c.width,c.height);return c}
function outlined(src,col){const [c,g]=mk(src.width+2,src.height+2);const s=silhouette(src,col||P.out);for(const [dx,dy] of [[0,1],[2,1],[1,0],[1,2]])g.drawImage(s,dx,dy);g.drawImage(src,1,1);return c}
function hoverSil(src){const [c,g]=mk(src.width+2,src.height+2);const s=silhouette(src,'#fff6d8');for(const [dx,dy] of [[0,1],[2,1],[1,0],[1,2]])g.drawImage(s,dx,dy);return c}
function pmap(g,x,y,rows,pal){for(let j=0;j<rows.length;j++){const row=rows[j];for(let i=0;i<row.length;i++){const ch=row[i];if(ch!=='.'&&pal[ch]){g.fillStyle=pal[ch];g.fillRect(x+i,y+j,1,1)}}}}
function mapCanvas(rows,pal,ol){const w=Math.max(...rows.map(r=>r.length)),h=rows.length;const [c,g]=mk(w,h);pmap(g,0,0,rows,pal);return ol?outlined(c,ol):c}

// ---------- 3x5 bitmap font ----------
const FONT = {
A:['.#.','#.#','###','#.#','#.#'],B:['##.','#.#','##.','#.#','##.'],C:['.##','#..','#..','#..','.##'],D:['##.','#.#','#.#','#.#','##.'],
E:['###','#..','##.','#..','###'],F:['###','#..','##.','#..','#..'],G:['.##','#..','#.#','#.#','.##'],H:['#.#','#.#','###','#.#','#.#'],
I:['###','.#.','.#.','.#.','###'],J:['..#','..#','..#','#.#','.#.'],K:['#.#','#.#','##.','#.#','#.#'],L:['#..','#..','#..','#..','###'],
M:['#.#','###','###','#.#','#.#'],N:['##.','#.#','#.#','#.#','#.#'],O:['.#.','#.#','#.#','#.#','.#.'],P:['##.','#.#','##.','#..','#..'],
Q:['.#.','#.#','#.#','##.','.##'],R:['##.','#.#','##.','#.#','#.#'],S:['.##','#..','.#.','..#','##.'],T:['###','.#.','.#.','.#.','.#.'],
U:['#.#','#.#','#.#','#.#','###'],V:['#.#','#.#','#.#','#.#','.#.'],W:['#.#','#.#','###','###','#.#'],X:['#.#','#.#','.#.','#.#','#.#'],
Y:['#.#','#.#','.#.','.#.','.#.'],Z:['###','..#','.#.','#..','###'],' ':['...','...','...','...','...']
};
function drawText(g,x,y,str,col){g.fillStyle=col;let cx=x;for(const ch of str){const gl=FONT[ch]||FONT[' '];for(let j=0;j<5;j++)for(let i=0;i<3;i++)if(gl[j][i]==='#')g.fillRect(cx+i,y+j,1,1);cx+=4}}

// ---------- trees & foliage ----------
function canopy(seed,pal,w,h,circles){
  const [c,g]=mk(w,h);const img=g.createImageData(w,h);const d=img.data;const cols=pal.map(hexRgb);
  const deep=(x,y)=>{let best=null,bv=-1;for(const cc of circles){const dx=x-cc[0],dy=y-cc[1],dist=Math.sqrt(dx*dx+dy*dy);const v=cc[2]-dist;if(v>=0&&v>bv){bv=v;best=[dx/cc[2],dy/cc[2]]}}return best};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const q=deep(x+.5,y+.5);if(!q)continue;
    const edge=!deep(x-.5,y+.5)||!deep(x+1.5,y+.5)||!deep(x+.5,y-.5)||!deep(x+.5,y+1.5);
    const cl=noise(x/3.1,y/3.1,seed);
    const v=(q[0]*0.45-q[1]*0.85)*0.55+(cl-.5)*0.75+(by(x,y)-.5)*0.35-(y/h)*0.22;
    const k=edge?0:v>0.4?4:v>0.1?3:v>-0.22?2:1;
    const i=(y*w+x)*4;d[i]=cols[k][0];d[i+1]=cols[k][1];d[i+2]=cols[k][2];d[i+3]=255;
  }
  g.putImageData(img,0,0);return c;
}
function swayed(src,cut){const [c,g]=mk(src.width+1,src.height);g.drawImage(src,0,cut,src.width,src.height-cut,0,cut,src.width,src.height-cut);g.drawImage(src,0,0,src.width,cut,1,0,src.width,cut);return c}
const PAL = {
  oak:['#1d3f25','#2b5a2f','#3c7d3a','#56a046','#80c25a'],
  oak2:['#22402a','#38652f','#4f8c3c','#6dab4b','#9ccd65'],
  pine:['#132f27','#1d4634','#285f42','#3a7d50','#58a062'],
  blossom:['#6e2a48','#a34a72','#d27499','#eea1bf','#ffd2e2'],
};
function makeOak(seed,pal,fruit){
  const circles=[[18,12,11],[9,19,8],[27,19,8],[18,22,10],[11,11,7],[25,12,7]];
  const cn=canopy(seed,pal,36,34,circles);
  if(fruit){const g=cn.getContext('2d');const R=rng(seed);for(let i=0;i<9;i++){const x=5+R()*26|0,y=8+R()*20|0;const dd=g.getImageData(x,y,1,1).data;if(dd[3]){g.fillStyle=fruit;g.fillRect(x,y,2,2);g.fillStyle='#ffd0c0';g.fillRect(x+1,y,1,1)}}}
  const [tc,tg]=mk(12,16);const r=painter(tg);
  r(3,0,6,13,P.w1);r(4,0,2,13,P.w2);r(8,2,1,9,P.w0);r(1,12,10,3,P.w1);r(2,12,2,1,P.w2);r(0,14,2,1,P.w1);r(10,14,2,1,P.w1);r(6,5,1,2,P.w0);
  const trunk=outlined(tc);
  const a=outlined(cn),b=outlined(swayed(cn,14));
  return {trunk,c:[a,b],w:38,kind:'oak'};
}
function makePine(seed){
  const w=26,h=40;const [c,g]=mk(w,h);const img=g.createImageData(w,h);const d=img.data;const cols=PAL.pine.map(hexRgb);
  const tiers=[[0,10,4],[8,12,7],[16,13,9.5],[25,14,12]];
  const hw=(y)=>{let m=-1,rel=0;for(const [t,hh,mw] of tiers){if(y>=t&&y<t+hh){const v=1+(y-t)/hh*mw;if(v>m){m=v;rel=(y-t)/hh}}}return [m,rel]};
  for(let y=0;y<h;y++){const [m,rel]=hw(y);if(m<0)continue;for(let x=0;x<w;x++){const dx=x+.5-13;if(Math.abs(dx)>m)continue;
    const edge=Math.abs(dx)>m-1||hw(y+1)[0]<Math.abs(dx);const cl=noise(x/2.6,y/2.6,seed);
    const v=(dx/m)*0.45+(cl-.5)*0.6+(by(x,y)-.5)*0.3-rel*0.45;const k=edge?0:v>0.35?4:v>0.05?3:v>-0.3?2:1;
    const i=(y*w+x)*4;d[i]=cols[k][0];d[i+1]=cols[k][1];d[i+2]=cols[k][2];d[i+3]=255}}
  g.putImageData(img,0,0);
  const [tc,tg]=mk(8,10);const r=painter(tg);r(2,0,4,9,P.w1);r(3,0,1,9,P.w2);r(0,8,8,2,P.w1);
  return {trunk:outlined(tc),c:[outlined(c),outlined(swayed(c,16))],w:28,kind:'pine'};
}
function makeBush(seed,pal,berry){
  const cn=canopy(seed,pal,18,13,[[9,7,6],[4,8,4],[14,8,4],[9,9,5]]);
  if(berry){const g=cn.getContext('2d');const R=rng(seed+3);for(let i=0;i<6;i++){const x=3+R()*12|0,y=3+R()*7|0;g.fillStyle=berry;g.fillRect(x,y,1,1);g.fillStyle='#fff3c0';g.fillRect(x,y-1,1,1)}}
  return outlined(cn);
}
function makeRock(seed,w,h){
  const [c,g]=mk(w,h);const img=g.createImageData(w,h);const d=img.data;const cols=[P.s0,P.s1,P.s2,P.s3].map(hexRgb);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const nx=(x+.5-w/2)/(w/2),ny=(y+.5-h/2)/(h/2);const rr=nx*nx+ny*ny*(ny<0?1.3:0.9);if(rr>1)continue;
    const v=(nx*0.4-ny*0.8)+(hash(x,y,seed)-.5)*0.3;const k=rr>0.8?0:v>0.45?3:v>-0.1?2:1;const i=(y*w+x)*4;d[i]=cols[k][0];d[i+1]=cols[k][1];d[i+2]=cols[k][2];d[i+3]=255}
  g.putImageData(img,0,0);return outlined(c);
}

// ---------- buildings ----------
function roofRows(r,top,rows,inset0,x0,x1,cols,bandH){
  for(let i=0;i<rows;i++){const y=top+i,ins=Math.round(inset0*(1-i/(rows-1))),a=x0+ins,b=x1-ins,band=Math.floor(i/bandH),k=i%bandH;
    r(a,y,b-a,1,k===bandH-1?cols[0]:k===0?cols[3]:cols[2]);
    if(k<bandH-1)for(let x=a+((band%2)*4)+2;x<b-1;x+=8)r(x,y,1,1,cols[1]);
    r(a,y,1,1,cols[0]);r(b-1,y,1,1,cols[1]);}
}
function bFarmhouse(){
  const [c,g]=mk(100,92);const r=painter(g);
  r(10,44,80,42,P.w3);for(let y=44;y<86;y+=5){r(10,y,80,1,P.w4);r(10,y+4,80,1,P.w2)}
  for(let y=44,i=0;y<86;y+=5,i++)for(let x=14+(i%2)*13;x<88;x+=26)r(x,y,1,4,P.w2);
  r(10,44,3,42,P.w1);r(87,44,3,42,P.w1);r(11,44,1,42,P.w2);r(88,44,1,42,P.w2);
  r(10,46,80,3,'rgba(40,18,8,.5)');
  r(8,84,84,6,P.s1);r(8,84,84,1,P.s2);for(let x=10;x<92;x+=7)r(x,85+(x%3===0?1:0),1,4,P.s0);r(8,89,84,1,P.s0);
  const win=(x,y)=>{r(x,y,14,12,P.w1);r(x+1,y+1,12,10,P.b1);r(x+1,y+6,12,5,P.b2);r(x+2,y+2,2,1,P.b4);r(x+2,y+3,1,1,P.b3);r(x+9,y+7,2,1,P.b3);
    r(x+1,y+1,2,6,P.cream);r(x+11,y+1,2,6,P.cream);r(x+1,y+1,12,1,P.r2);r(x+7,y+1,1,10,P.w1);r(x+1,y+6,12,1,P.w1);
    r(x-1,y+12,16,2,P.w5);r(x-1,y+13,16,1,P.w4);r(x,y+14,14,3,P.w2);r(x,y+16,14,1,P.w1);
    const fl=['#e8455a','#ffd36b','#f4a9c4','#ffffff','#e8455a','#9b6fd0'];for(let i=0;i<6;i++){r(x+1+i*2,y+12,1,1,fl[i]);r(x+1+i*2,y+13,1,1,P.g2);r(x+2+i*2,y+13,1,1,P.g1)}};
  win(17,54);win(69,54);
  r(44,61,12,24,P.w0);r(45,62,10,23,P.w2);r(47,62,1,23,P.w1);r(50,62,1,23,P.w1);r(53,62,1,23,P.w1);r(45,62,10,1,P.w3);
  r(47,65,6,4,P.b2);r(47,65,2,1,P.b4);r(53,74,1,2,P.d4);
  r(42,85,16,5,P.s2);r(42,85,16,1,P.s3);r(44,88,12,2,P.s1);
  r(59,63,4,5,P.glow);r(59,62,4,1,P.w0);r(60,61,2,1,P.w0);r(59,68,4,1,P.w0);r(60,64,1,1,'#fff3c0');
  roofRows(r,6,40,15,4,96,[P.r0,P.r1,P.r2,P.r3],5);
  r(19,5,62,1,P.r0);r(20,6,60,1,P.r3);r(4,45,92,1,P.r0);
  for(let y=0;y<10;y++)for(let x=0;x<10;x++){const dx=x-4.5,dy=y-4.5,dd=dx*dx+dy*dy;if(dd<=25){r(45+x,19+y,1,1,dd>13?P.w1:(dx<0&&dy<0?P.b3:P.b1))}}
  r(49,20,1,8,P.w1);r(46,23,8,1,P.w1);r(47,21,1,1,P.b4);
  r(70,0,10,20,P.s1);r(71,0,2,20,P.s2);for(let y=3;y<20;y+=4)r(70,y,10,1,P.s0);for(let y=1;y<20;y+=4)r(74+((y>>2)%2)*3,y,1,2,P.s0);r(69,0,12,3,P.s0);r(70,0,10,1,P.s2);
  r(70,18,10,2,'rgba(60,20,10,.4)');
  return c;
}
function bWorkshop(){
  const [c,g]=mk(96,86);const r=painter(g);
  r(8,40,80,40,P.w2);for(let x=8;x<88;x+=5){r(x,40,1,40,P.w1);r(x+1,40,1,40,P.w3)}
  r(8,40,3,40,P.w0);r(85,40,3,40,P.w0);r(8,42,80,3,'rgba(30,14,6,.5)');
  r(6,80,84,5,P.s1);r(6,80,84,1,P.s2);for(let x=9;x<90;x+=8)r(x,81,1,4,P.s0);r(6,84,84,1,P.s0);
  for(let i=0;i<34;i++){const y=8+i,ins=Math.round(8*(1-i/33)),a=4+ins,b=92-ins;for(let x=a;x<b;x++)r(x,y,1,1,((x>>1)&1)?P.br2:P.br1);
    if(i%9===8)r(a,y,b-a,1,P.br0);if(i<2)r(a,y,b-a,1,P.br3);r(a,y,1,1,P.br0);r(b-1,y,1,1,P.br0)}
  r(4,41,88,1,P.br0);
  r(28,48,32,3,P.w1);r(30,51,28,29,P.w0);r(31,52,12,28,P.w3);r(45,52,12,28,P.w3);
  for(let t=0;t<28;t++){r(31+Math.floor(t*11/27),52+t,1,1,P.w1);r(42-Math.floor(t*11/27),52+t,1,1,P.w1);r(45+Math.floor(t*11/27),52+t,1,1,P.w1);r(56-Math.floor(t*11/27),52+t,1,1,P.w1)}
  r(31,52,12,1,P.w4);r(45,52,12,1,P.w4);r(43,52,2,28,P.w0);r(41,64,1,3,P.s3);r(46,64,1,3,P.s3);
  r(66,50,14,12,P.w0);r(67,51,12,10,'#f2c46b');r(67,51,12,3,'#e3a94a');r(72,51,1,10,P.w0);r(67,55,12,1,P.w0);r(68,57,2,3,'#7a5530');r(75,56,2,4,'#7a5530');r(65,62,16,2,P.w4);
  r(34,42,20,6,P.w5);r(34,42,20,1,P.w4);r(34,47,20,1,P.w1);
  pmap(g,40,42,['.#.#.','#####','##.##','#####','.#.#.'].map(s=>s.replace(/#/g,'a')),{a:P.s1});
  r(13,52,10,3,P.s3);r(13,54,10,1,P.s2);for(let x=13;x<23;x+=2)r(x,55,1,1,P.s2);r(22,51,3,5,P.w4);
  r(15,60,2,10,P.w5);r(13,59,6,3,P.s2);r(13,59,6,1,P.s3);
  r(20,61,2,9,P.s2);r(19,60,4,2,P.s2);r(20,60,2,1,P.w2);
  r(74,0,6,16,P.s2);r(74,0,1,16,P.s3);r(73,0,8,2,P.s1);r(73,6,8,1,P.s1);
  return c;
}
function bLibrary(){
  const [c,g]=mk(96,100);const r=painter(g);const R=rng(77);
  r(8,46,80,42,P.plaster);for(let i=0;i<70;i++)r(9+R()*78|0,47+R()*40|0,1,1,P.plaster2);
  for(const x of [8,34,60,86])r(x,46,2,42,P.w1);r(8,46,80,2,P.w1);r(8,48,80,2,'rgba(40,30,60,.35)');
  r(6,88,84,8,P.s1);for(let y=88;y<96;y+=4)for(let x=6+((y>>2)%2)*5;x<90;x+=10){r(x,y,9,3,P.s2);r(x,y,9,1,P.s3)}r(6,95,84,1,P.s0);
  const arch=(x0)=>{for(let y=50;y<82;y++)for(let x=x0;x<x0+16;x++){const dx=x+.5-(x0+8),dy=y+.5-58;const ins=y>=58||dx*dx+dy*dy<=64;if(!ins)continue;
      const edge=y===81||x===x0||x===x0+15||(y<58&&dx*dx+dy*dy>42);r(x,y,1,1,edge?P.w1:P.w0)}
    const cols=['#c0443a','#3c6bb0','#4f8c3c','#e0b84f','#7b4fa0','#d27499','#e5c58e','#2a6d73'];
    for(const sy of [60,67,74]){r(x0+1,sy+5,14,1,P.w3);for(let x=x0+1;x<x0+15;x++){if(R()<.15)continue;const hh=3+(R()*2|0);r(x,sy+5-hh,1,hh,cols[R()*cols.length|0])}}
    r(x0+3,53,2,1,'rgba(255,255,255,.55)');r(x0+3,54,1,2,'rgba(255,255,255,.4)');r(x0+11,70,1,3,'rgba(255,255,255,.3)');
    r(x0-1,82,18,2,P.w4);};
  arch(14);arch(66);
  for(let y=56;y<88;y++)for(let x=41;x<55;x++){const dx=x+.5-48,dy=y+.5-63;if(y<63&&dx*dx+dy*dy>49)continue;const edge=x===41||x===54||(y<63&&dx*dx+dy*dy>32);r(x,y,1,1,edge?P.w0:P.w2)}
  r(47,57,2,31,P.w0);r(44,60,1,28,P.w1);r(51,60,1,28,P.w1);r(46,72,1,2,P.d4);r(49,72,1,2,P.d4);
  r(38,88,20,4,P.s2);r(38,88,20,1,P.s3);
  r(40,50,16,5,P.w5);r(40,54,16,1,P.w1);r(44,51,3,3,P.cream);r(49,51,3,3,P.cream);r(47,51,2,3,P.w2);
  for(let y=48;y<88;y++){const n=hash(1,y,5);if(n<.75){r(10+(n*4|0),y,1,1,n<.3?P.g1:P.g2);}if(n<.4)r(11+(n*6|0),y,1,1,P.g3)}
  for(let i=0;i<44;i++){const y=4+i,ins=Math.round(22*(1-i/43)),a=4+ins,b=92-ins,k=i%4,band=i>>2;
    r(a,y,b-a,1,k===3?P.sl0:k===0?P.sl3:P.sl2);if(k>=2)for(let x=a+(band%2)*3+1;x<b;x+=6)r(x,y,1,1,P.sl1);r(a,y,1,1,P.sl0);r(b-1,y,1,1,P.sl1)}
  r(4,47,88,1,P.sl0);r(26,4,44,1,P.sl0);
  for(let y=0;y<15;y++)for(let x=0;x<15;x++){const dx=x-7,dy=y-7,dd=dx*dx+dy*dy;if(dd<=49)r(41+x,17+y,1,1,dd>30?P.w1:'#f6d27a')}
  r(47,18,2,13,P.w1);r(42,24,13,1,P.w1);r(44,20,1,1,'#fff3c8');
  r(47,0,2,5,P.w0);r(46,0,4,2,P.d4);
  return c;
}
function bLab(){
  const [c,g]=mk(90,88);const r=painter(g);
  r(8,40,74,38,'#d4d9df');for(let x=8;x<82;x+=12)r(x,40,1,38,'#a9b0ba');for(let y=44;y<78;y+=8)for(let x=10;x<82;x+=12){r(x,y,1,1,P.s2);r(x+9,y,1,1,P.s2)}
  r(8,40,74,3,'#a9b0ba');r(8,43,74,2,'rgba(30,50,60,.3)');
  r(6,78,78,5,P.s1);r(6,78,78,1,P.s2);r(6,82,78,1,P.s0);
  for(let i=0;i<14;i++){const y=28+i,ins=Math.round(4*(1-i/13));r(4+ins,y,82-2*ins,1,i<2?P.t3:i===13?P.t0:P.t2);}
  for(let x=6;x<84;x+=6)r(x,30,1,10,P.t1);
  for(let y=10;y<=29;y++)for(let x=27;x<64;x++){const dx=x+.5-45.5,dy=y+.5-29;const dd=dx*dx+dy*dy;if(dd>18*18||dy>0)continue;const edge=dd>16.8*16.8;
    r(x,y,1,1,edge?P.t0:(dx>4&&dy<-6)?P.t3:dx>-4?P.t2:P.t1)}
  for(let y=12;y<29;y++)r(43,y,4,1,P.s0);r(44,13,2,1,P.s3);r(36,22,1,7,P.t1);r(54,22,1,7,P.t1);
  r(71,2,2,28,P.s1);r(71,2,1,28,P.s2);r(68,10,8,1,P.s1);r(69,16,6,1,P.s1);
  const win=(x)=>{r(x,48,14,13,P.s1);r(x+1,49,12,11,P.labglow);r(x+1,49,12,2,'#c8ffe6');r(x+3,53,2,6,P.t1);r(x+2,57,4,2,P.t1);r(x+8,52,3,7,P.t1);r(x+9,51,1,1,P.t1);r(x+7,58,5,1,P.t1);r(x-1,61,16,2,P.s2)};
  win(14);win(62);
  r(37,50,16,3,P.out);for(let x=37;x<53;x+=4)r(x,50,2,3,'#f2c94c');
  r(37,53,16,25,P.s1);r(38,54,14,24,P.s2);r(41,57,8,5,P.labglow);r(41,57,8,1,'#c8ffe6');r(44,54,1,24,P.s1);r(49,67,2,2,P.s0);
  r(2,34,3,44,P.s2);r(2,34,1,44,P.s3);r(2,34,8,3,P.s2);r(1,46,5,2,P.s1);r(1,64,5,2,P.s1);r(1,75,5,3,P.s1);
  r(84,50,4,22,P.s1);r(85,50,1,22,P.s2);r(83,56,6,2,P.s0);r(83,66,6,2,P.s0);
  return c;
}

// ---------- props ----------
function prop(w,h,fn){const [c,g]=mk(w,h);fn(painter(g),g);return outlined(c)}
const PROPS = {
  mailbox:()=>prop(13,18,r=>{r(4,8,2,10,P.w1);r(5,8,1,10,P.w2);r(0,2,10,7,P.r1);r(1,1,8,1,P.r2);r(1,2,8,2,P.r2);r(0,4,1,4,P.r0);r(9,0,1,6,P.s2);r(10,0,3,2,P.r3)}),
  board:()=>prop(26,24,r=>{r(2,6,2,18,P.w1);r(22,6,2,18,P.w1);r(0,3,26,15,P.w2);r(1,4,24,13,P.w3);r(0,1,26,3,P.w1);r(0,1,26,1,P.w4);
    r(3,6,7,8,P.cream);r(4,8,5,1,P.w2);r(4,10,4,1,P.w2);r(4,12,5,1,P.w2);r(6,6,1,1,P.r2);
    r(12,5,6,6,'#fff6d8');r(13,7,4,1,P.b1);r(13,9,3,1,P.b1);r(14,5,1,1,P.b2);
    r(19,7,5,8,P.cream);r(20,9,3,1,P.w2);r(20,11,3,1,P.w2);r(21,7,1,1,P.g1);r(12,12,5,4,'#f6d27a');r(13,13,3,1,P.w2)}),
  shipbin:()=>prop(20,15,r=>{r(0,4,20,11,P.w2);for(let x=0;x<20;x+=5)r(x,4,1,11,P.w1);r(0,0,20,5,P.w3);r(0,0,20,1,P.w4);r(0,4,20,1,P.w1);r(8,2,4,2,P.s2);r(1,8,18,1,P.w3)}),
  crt:()=>prop(30,22,r=>{r(0,10,30,3,P.w3);r(0,10,30,1,P.w4);r(2,13,2,9,P.w1);r(26,13,2,9,P.w1);r(2,17,24,1,P.w1);
    r(6,0,16,11,P.s3);r(6,0,16,1,P.s4);r(7,1,14,8,P.s1);r(8,2,12,6,'#14261f');r(9,9,10,1,P.s2);r(11,11,7,2,P.s2);
    r(24,7,3,3,P.cream);r(27,8,1,1,P.cream);r(1,7,4,3,P.g2);r(2,5,2,2,P.g3);r(1,8,4,2,P.r1)}),
  crate:()=>prop(12,11,r=>{r(0,0,12,11,P.w3);r(0,0,12,1,P.w4);r(0,0,1,11,P.w1);r(11,0,1,11,P.w1);r(0,10,12,1,P.w1);for(let i=0;i<10;i++)r(1+i,1+i,1,1,P.w2)}),
  barrel:()=>prop(10,13,r=>{r(0,2,10,11,P.w2);r(1,2,2,11,P.w3);r(7,2,2,11,P.w1);r(0,4,10,1,P.s1);r(0,10,10,1,P.s1);r(1,0,8,3,P.w3);r(2,1,6,1,P.w1)}),
  hay:()=>prop(16,11,r=>{r(0,1,16,10,P.hay);r(0,1,16,2,'#f0d27a');for(let x=1;x<16;x+=3)r(x,3,1,7,P.hayD);r(4,1,1,10,P.w1);r(11,1,1,10,P.w1);r(0,10,16,1,P.hayD)}),
  scarecrow:()=>prop(18,28,r=>{r(8,10,2,18,P.w1);r(1,11,16,2,P.w2);r(5,10,8,9,P.r1);r(5,10,8,1,P.r2);r(7,13,3,3,'#e0b84f');r(5,18,8,2,'#3f6fa8');r(0,11,2,3,P.hay);r(16,11,2,3,P.hay);
    r(5,3,8,7,P.d4);r(7,6,1,1,P.out);r(10,6,1,1,P.out);r(7,8,4,1,P.d1);r(2,2,14,2,'#e6c160');r(5,0,8,3,'#e6c160');r(5,2,8,1,P.r1)}),
  lamp:()=>prop(7,28,r=>{r(3,6,1,22,P.s0);r(2,25,3,3,P.s0);r(1,0,5,6,P.glow);r(1,0,5,1,P.s0);r(1,5,5,1,P.s0);r(3,1,1,4,'#fff3c0');r(0,0,7,1,P.s0)}),
  bench:()=>prop(24,12,r=>{r(0,0,24,3,P.w2);r(0,0,24,1,P.w3);r(0,5,24,3,P.w3);r(0,5,24,1,P.w4);r(2,8,2,4,P.w1);r(20,8,2,4,P.w1);r(2,3,2,2,P.w1);r(20,3,2,2,P.w1)}),
  gearbase:()=>prop(22,12,r=>{r(0,0,22,12,P.s1);r(0,0,22,1,P.s2);r(2,3,6,4,P.s0);r(3,4,4,2,'#ffb347');r(12,3,8,1,P.s2);r(12,6,8,1,P.s2);r(0,11,22,1,P.s0)}),
  tesla:()=>prop(12,30,r=>{r(2,22,8,8,P.s1);r(2,22,8,1,P.s2);r(4,6,4,16,'#c77a3a');for(let y=7;y<22;y+=2)r(4,y,4,1,'#e8a060');r(1,0,10,7,P.s2);r(2,1,4,2,P.s4)}),
  vat:()=>prop(18,24,r=>{r(0,17,18,7,P.s1);r(0,17,18,1,P.s2);r(1,0,16,17,P.s2);r(2,1,14,15,'#2a4a4a');r(2,6,14,10,'#4fc982');r(2,6,14,1,'#9ff0c0');r(3,2,1,12,'rgba(255,255,255,.35)');r(0,0,18,2,P.s1);r(7,20,4,2,P.labglow)}),
  well:()=>prop(24,28,r=>{r(1,15,22,12,P.s2);for(let y=15;y<27;y+=4)for(let x=1+((y>>2)%2)*3;x<23;x+=6){r(x,y,5,3,P.s3);r(x+4,y,1,3,P.s1)}r(1,15,22,2,P.s1);r(3,16,18,1,P.b0);
    r(2,4,2,12,P.w1);r(20,4,2,12,P.w1);r(0,0,24,5,P.r1);r(0,0,24,1,P.r3);r(0,4,24,1,P.r0);r(4,7,16,1,P.w2);r(11,7,1,4,P.s0);r(9,11,5,4,P.w3);r(9,11,5,1,P.w4)}),
  sign:()=>prop(16,18,r=>{r(7,4,2,14,P.w1);r(0,2,14,6,P.w4);r(0,2,14,1,P.w5);r(14,3,2,4,P.w4);r(0,7,14,1,P.w2);r(2,4,8,1,P.w1);r(2,6,6,0,P.w1)}),
  logs:()=>prop(18,9,r=>{for(const [x,y] of [[0,4],[6,4],[12,4],[3,0],[9,0]]){r(x,y,6,5,P.w2);r(x+1,y+1,4,3,P.d3);r(x+2,y+2,2,1,P.d2)}}),
  can:()=>prop(9,7,r=>{r(1,2,6,5,P.s2);r(1,2,6,1,P.s3);r(7,3,2,1,P.s2);r(0,1,3,1,P.s1);r(3,0,2,2,P.s1)}),
  pumpkins:()=>prop(16,8,r=>{r(0,2,7,6,'#e07a26');r(1,2,1,6,'#f6a24a');r(3,2,1,6,'#c25e18');r(3,0,1,2,P.g1);r(8,3,8,5,'#e8892e');r(10,3,1,5,'#c25e18');r(13,3,1,5,'#c25e18');r(11,1,1,2,P.g1)}),
  dock:()=>prop(22,30,r=>{r(0,0,22,30,P.w3);for(let y=0;y<30;y+=5){r(0,y+4,22,1,P.w1);r(0,y,22,1,P.w4)}r(0,0,2,30,P.w1);r(20,0,2,30,P.w1);r(5,2,1,1,P.w1);r(15,12,1,1,P.w1)}),
};

// ---------- crops ----------
const CROP_TYPES = ['wheat','carrot','cabbage','corn','pumpkin','tomato'];
function cropSprite(type,stage,sw){
  const [c,g]=mk(14,26);const r=painter(g);const s=sw?1:0;
  r(3,23,8,2,P.d0);r(4,22,6,1,P.d0);
  if(stage===0){r(4,22,1,1,P.d4);r(7,23,1,1,P.d4);r(9,22,1,1,P.d4);return c}
  if(stage===1){r(6,19,1,4,P.g2);r(4+s,18,2,1,P.g3);r(7+s,17,2,1,P.g3);r(4+s,19,1,1,P.g1);r(8+s,18,1,1,P.g1);return c}
  const ripe=stage===3;
  if(type==='wheat'){for(let i=0;i<5;i++){const x=2+i*2,h=(ripe?14:10)+(i%2)*2,col=ripe?'#c99a3a':P.g2;r(x,24-h,1,h,col);r(x+(i%2?s:0),24-h-1,1,1,ripe?'#f2d06a':P.g3);if(ripe){r(x-1+s,24-h,1,3,P.gold);r(x+s,24-h+1,1,1,'#fff0a8')}r(x+1,24-h+5,1,1,ripe?'#b58628':P.g1)}}
  else if(type==='carrot'){for(let i=0;i<4;i++){r(3+i*2+s,(ripe?12:15)+(i%2),1,8,P.g2);r(2+i*2+s,(ripe?13:16)+(i%2),1,2,P.g3);r(4+i*2,(ripe?15:17),1,2,P.g1)}if(ripe){r(4,21,6,2,'#ee8a2a');r(5,21,2,1,'#ffb060')}}
  else if(type==='cabbage'){const rw=ripe?10:6,rh=ripe?8:5,x0=7-rw/2,y0=23-rh;for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){const dx=(x+.5-rw/2)/(rw/2),dy=(y+.5-rh/2)/(rh/2);if(dx*dx+dy*dy>1.05)continue;r(x0+x,y0+y,1,1,(dx*dx+dy*dy>.7)?'#3f8f4a':(dx>0&&dy<0)?'#b8e88a':'#7fcc6a')}if(ripe){r(7,y0+2,1,5,'#5aa85a');r(4,y0+3,2,1,'#5aa85a')}}
  else if(type==='corn'){const h=ripe?22:15;r(6,24-h,2,h,'#5f9a3c');r(6,24-h,1,h,'#7fbe50');for(let k=0;k<3;k++){const y=24-h+5+k*5;if(y>21)break;r(k%2?8:2,y+(k%2?0:s),4,1,P.g2);r(k%2?11:1,y+1+s,2,1,P.g1)}if(ripe){r(8,9,2,5,'#f2d06a');r(8,9,2,1,'#fff0a8');r(9,14,1,1,P.g1);r(5+s,0,1,3,'#d8b85a');r(7+s,0,1,2,'#d8b85a');r(3,12,2,4,'#f2d06a')}}
  else if(type==='pumpkin'){r(1,20,12,2,P.g1);r(2+s,17,3,3,P.g2);r(9-s,18,3,2,P.g2);if(ripe){r(3,16,8,7,'#e07a26');r(4,16,2,7,'#f6a24a');r(7,16,1,7,'#c25e18');r(3,22,8,1,'#a84c12');r(7,14,1,2,P.w1)}else{r(5,19,4,3,'#8fbe4a')}}
  else if(type==='tomato'){r(6,8,1,16,P.w3);r(5,8,3,1,P.w3);for(let k=0;k<4;k++){r(k%2?7:3,11+k*3+s*(k%2),4,2,P.g2);r(k%2?8:3,12+k*3,2,1,P.g1)}if(ripe){for(const [x,y] of [[3,13],[8,15],[4,18],[9,20]]){r(x,y,2,2,'#d8402e');r(x,y,1,1,'#ff8a70')}}else{r(4,14,2,2,'#b8d860');r(8,17,2,2,'#b8d860')}}
  return c;
}

// ---------- characters ----------
function drawAgent(g,X,Y,a,dir,frame,pose,t){
  const p=a.pal,flip=dir==='right',side=dir==='left'||dir==='right',f=frame&3,walk=pose==='walk';
  const sitting=pose==='sit'||pose==='sleep'||pose==='read';
  let oy=pose==='work'&&a.liveStatus==='working'?(Math.floor(t*4)%2):0;if(walk&&(f===1||f===3))oy=-1;if(sitting)oy=2;
  const O=P.out;
  const r=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(X+(flip?12-x-w:x),Y+y+oy,w,h)};
  g.fillStyle='rgba(18,32,14,.30)';g.fillRect(X+2,Y+17,8,2);g.fillRect(X+1,Y+18,10,1);
  r(2,9,8,6,O);r(3,10,6,4,p.shirt);r(3,13,6,1,p.shirtD);
  const o=a.outfit;
  if(dir==='down'){
    if(o==='overalls'){r(4,10,1,2,p.acc);r(7,10,1,2,p.acc);r(4,12,4,2,p.acc);r(5,12,1,1,P.gold)}
    else if(o==='vest'){r(3,10,2,4,p.acc);r(7,10,2,4,p.acc)}
    else if(o==='apron'){r(4,11,4,4,p.acc);r(4,10,1,1,p.acc);r(7,10,1,1,p.acc);r(5,12,2,1,'#6a4428')}
    else if(o==='coat'){r(5,10,2,3,p.acc);r(5,13,2,1,p.shirtD)}
    else if(o==='cardigan'){r(5,10,2,4,p.acc);r(4,11,1,1,P.w1)}
    else if(o==='sweater'){r(3,12,6,1,p.shirtD);r(3,10,6,1,p.acc)}
  } else if(dir==='up'){
    if(o==='overalls'){r(4,10,1,4,p.acc);r(7,10,1,4,p.acc);r(4,13,4,1,p.acc)}
    else if(o==='apron'){r(4,10,4,1,p.acc)}
    else if(o==='sweater'){r(3,12,6,1,p.shirtD)}
  } else {
    if(o==='overalls'||o==='apron'){r(3,11,3,3,p.acc);r(5,10,1,1,p.acc)}
    else if(o==='vest'){r(6,10,3,4,p.acc)}
    else if(o==='coat'||o==='cardigan'){r(3,10,1,4,p.acc)}
    else if(o==='sweater'){r(3,12,6,1,p.shirtD)}
  }
  if(o==='coat'&&!sitting){r(2,14,8,2,O);r(3,14,6,1,p.shirt)}
  // legs
  if(sitting){r(2,14,8,3,O);r(3,14,6,1,p.pants);if(!side){r(3,15,2,1,p.pants);r(7,15,2,1,p.pants);r(3,16,2,1,p.shoe);r(7,16,2,1,p.shoe)}else{r(1,14,4,3,O);r(1,15,3,1,p.pants);r(1,16,2,1,p.shoe)}}
  else if(!side){const lu=walk&&f===1?1:0,ru=walk&&f===3?1:0;
    r(2,14,8,1,O);r(3,14,6,1,o==='coat'?p.shirt:p.pants);
    r(2,15,4,4-lu,O);r(3,15,2,2-lu,p.pants);r(3,17-lu,2,1,p.shoe);
    r(6,15,4,4-ru,O);r(7,15,2,2-ru,p.pants);r(7,17-ru,2,1,p.shoe);}
  else{r(2,14,8,1,O);r(3,14,6,1,o==='coat'?p.shirt:p.pants);
    if(walk&&(f===1||f===3)){r(1,15,4,4,O);r(2,15,2,2,p.pants);r(1,17,3,1,p.shoe);r(6,15,4,4,O);r(7,15,2,2,p.pantsD||p.pants);r(7,17,2,1,p.shoe)}
    else{r(3,15,6,4,O);r(4,15,4,2,p.pants);r(3,17,5,1,p.shoe)}}
  // arms
  const working=pose==='work'||pose==='water';
  if(!side){let la=0,ra=0;if(walk){if(f===1)la=1;if(f===3)ra=1}
    if(working){const k=Math.floor(t*6+a.seed)%2;la=k?2:1;ra=k?1:2}
    if(pose==='read'){la=2;ra=2}
    r(1,10,1,4,O);r(2,10,1,3-la,p.shirtD);r(2,13-la,1,1,p.skin);
    r(10,10,1,4,O);r(9,10,1,3-ra,p.shirtD);r(9,13-ra,1,1,p.skin);}
  else{let ax=5,hy=13;if(walk){if(f===1)ax=4;if(f===3)ax=6}if(working){hy=Math.floor(t*5+a.seed)%2?11:12;ax=3}
    r(ax-1,10,1,hy-9,O);r(ax,10,2,hy-10,p.shirtD);r(ax,hy,2,1,p.skin);}
  // head
  const hb=(pose==='sleep')?1:(pose==='idle'&&Math.floor(t*1.4+a.seed)%2)?1:0;
  const h=(x,y,w,hh,col)=>r(x,y+hb,w,hh,col);
  h(2,0,8,10,O);h(1,1,10,8,O);h(2,1,8,8,p.skin);h(2,8,8,1,p.skinD);
  const blink=pose==='sleep'||((t+a.seed*1.7)%3.4)<0.13;
  if(dir==='down'){h(2,1,8,3,p.hair);h(2,4,1,2,p.hair);h(9,4,1,2,p.hair);h(4,4,1,1,p.hair);h(7,4,1,1,p.hairD);h(3,3,6,1,p.hairD);
    if(blink){h(3,6,2,1,O);h(7,6,2,1,O)}else{h(4,5,1,2,O);h(7,5,1,2,O)}
    h(3,7,1,1,'#e8968a');h(8,7,1,1,'#e8968a');
    if(pose==='talk'&&Math.floor(t*7)%2)h(5,7,2,1,'#8a3a2e');
    if(a.long){h(2,4,1,6,p.hair);h(9,4,1,6,p.hair)}}
  else if(dir==='up'){h(2,1,8,7,p.hair);h(2,7,8,1,p.hairD);h(3,8,6,1,p.skinD);if(a.long){h(2,7,8,3,p.hair);h(2,9,8,1,p.hairD)}}
  else{h(2,1,8,3,p.hair);h(6,3,4,5,p.hair);h(9,2,1,6,p.hairD);h(6,7,3,1,p.hairD);
    if(blink)h(2,6,2,1,O);else h(3,5,1,2,O);h(4,7,1,1,'#e8968a');if(a.long)h(6,3,4,7,p.hair);}
  switch(a.hat){
    case 'straw':h(0,3,12,1,p.hat);h(0,4,12,1,O);h(2,0,8,3,p.hat);h(2,2,8,1,p.band);h(3,0,6,1,p.hatL||p.hat);h(0,3,1,1,p.hatD);h(11,3,1,1,p.hatD);break;
    case 'cap':h(2,0,8,3,p.hat);h(3,0,3,1,p.hatL||p.hat);if(dir==='down')h(1,3,10,1,p.hatD);else if(side)h(0,3,5,1,p.hatD);else h(2,3,8,1,p.hatD);break;
    case 'goggles':h(2,3,8,1,P.s1);if(dir==='down'){h(3,2,2,2,'#8fe4e0');h(7,2,2,2,'#8fe4e0');h(3,2,1,1,'#e6fffd');h(7,2,1,1,'#e6fffd')}else if(side){h(2,2,2,2,'#8fe4e0');h(2,2,1,1,'#e6fffd')}break;
    case 'bandana':h(2,1,8,2,p.hat);h(2,2,8,1,p.hatD);if(dir==='up')h(5,3,2,2,p.hat);if(side){h(10,2,2,2,p.hat);h(10,4,1,1,p.hatD)}break;
    case 'beanie':h(2,0,8,4,p.hat);h(2,3,8,1,p.hatD);for(let x=3;x<9;x+=2)h(x,1,1,2,p.hatD);h(5,-1,2,1,P.cream);break;
    case 'flower':if(dir==='up'){h(4,2,2,2,'#f4a9c4');h(4,2,1,1,'#ffe08a')}else{h(8,1,2,2,'#f4a9c4');h(8,1,1,1,'#ffe08a')}break;
  }
  // Live work: hammer a part on a workbench with visible impact sparks.
  if(pose==='work'&&a.liveStatus==='working'){
    const strike=Math.floor(t*4)%2;
    r(11,15,10,2,P.w2);r(12,17,2,3,P.w3);r(18,17,2,3,P.w3);
    r(14,13,5,2,P.s2);
    r(10,9+strike*3,2,5,P.w1);r(8,8+strike*3,6,2,P.s1);
    r(9,11+strike,2,2,p.skin);
    if(strike){r(16,10,1,2,'#ffe08a');r(20,12,2,1,'#ffe08a');}
  }
  // held props
  if(pose==='read'){r(3,12,6,3,'#7a3a5a');r(4,12,4,2,P.cream);r(6,12,1,2,P.cream2);if(Math.floor(t/4)%2)r(4,12,2,1,'#fff')}
  if(pose==='water'){r(-2,11,4,3,P.s2);r(-2,11,4,1,P.s3);r(-4,12,2,1,P.s2);const k=Math.floor(t*8)%3;g.fillStyle=P.b3;g.fillRect(X+(flip?12-(-5)-1:-5),Y+oy+14+k,1,1);g.fillRect(X+(flip?12-(-4)-1:-4),Y+oy+16+((k+1)%3),1,1)}
  if(pose==='work'&&a.tool==='clipboard'&&side){r(0,10,3,4,P.w3);r(0,10,2,3,P.cream);r(1,9,1,1,P.s2)}
}

// ---------- icon maps ----------
const ICON5 = {
  gear:[['.a.a.','aaaaa','aa.aa','aaaaa','.a.a.'],{a:'#c9ccd6'}],
  book:[['aa.cc','ab.cb','aa.cc','ab.cb','ddddd'],{a:'#f3e2b8',b:'#7f4f2c',c:'#f3e2b8',d:'#c0443a'}],
  flask:[['.aa..','.aa..','abba.','bbbba','bbbbb'],{a:'#c8e0ea',b:'#5fd38a'}],
  clip:[['.aa..','bccb.','bddb.','bccb.','bbbb.'],{a:'#b5b8c3',b:'#a46b3b',c:'#f3e2b8',d:'#7f4f2c'}],
  sprout:[['a...a','aa.aa','.aaa.','..b..','..b..'],{a:'#94d066',b:'#3c7d3a'}],
  quill:[['...aa','..aa.','.aa..','.b...','b....'],{a:'#ffffff',b:'#3b2216'}],
};

// ---------- main ----------
export function createFarm(cfg){
  const canvas=cfg.canvas,ctx=canvas.getContext('2d');
  const R=rng(20261007);
  const SEG=[[0,336,960,336,10],[166,238,166,336,8],[460,262,460,336,8],[684,240,684,500,8],[684,500,752,500,7],[752,482,752,500,7],[232,336,232,562,6],[520,336,520,420,7],[460,336,460,336,15],[684,336,684,336,13]];
  const PONDS=[[520,470,76,42],[468,490,40,26],[578,482,40,30]];
  const FIELD=[72,388,336,568];
  // ----- masks
  const pd=new Float32Array(W*H).fill(99), wf=new Float32Array(W*H).fill(9);
  for(const [x1,y1,x2,y2,hw] of SEG){const minx=Math.max(0,Math.min(x1,x2)-hw-6|0),maxx=Math.min(W-1,Math.max(x1,x2)+hw+6|0),miny=Math.max(0,Math.min(y1,y2)-hw-6|0),maxy=Math.min(H-1,Math.max(y1,y2)+hw+6|0);
    const dx=x2-x1,dy=y2-y1,L=dx*dx+dy*dy||1;
    for(let y=miny;y<=maxy;y++)for(let x=minx;x<=maxx;x++){let tt=((x-x1)*dx+(y-y1)*dy)/L;tt=Math.max(0,Math.min(1,tt));const ex=x-(x1+dx*tt),ey=y-(y1+dy*tt);const d=Math.sqrt(ex*ex+ey*ey)-hw;const i=y*W+x;if(d<pd[i])pd[i]=d}}
  for(let y=400;y<540;y++)for(let x=410;x<640;x++){let m=9;for(const [cx,cy,rx,ry] of PONDS){const a=(x-cx)/rx,b=(y-cy)/ry;m=Math.min(m,a*a+b*b)}wf[y*W+x]=m+(noise(x/6,y/6,9)-.5)*0.16}
  const isPath=(x,y)=>{x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return false;const i=y*W+x;return pd[i]+(noise(x/5,y/5,7)-.5)*3.2<0};
  const isWater=(x,y)=>{x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return false;return wf[y*W+x]<1};
  const inField=(x,y)=>x>=FIELD[0]&&x<FIELD[2]&&y>=FIELD[1]&&y<FIELD[3];
  // ----- ground
  const [ground,gg]=mk(W,H);
  {const img=gg.createImageData(W,H),d=img.data;const C={};for(const k of ['g1','g2','g3','g4','d0','d1','d2','d3','d4','b0','b1','b2','b3','b4'])C[k]=hexRgb(P[k]);
    const WC=[hexRgb('#285a92'),hexRgb('#336fae'),hexRgb('#4a8dca'),hexRgb('#69a9da')],FOAM=hexRgb('#a8dcf2');
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,o=i*4;let col;
      const pj=pd[i]+(noise(x/5,y/5,7)-.5)*3.2;const f=wf[i];
      if(f<1){const above=wf[(y-1)*W+x]>=1?1:wf[(y-2)*W+x]>=1?2:wf[(y-3)*W+x]>=1?3:0;
        if(above===1)col=C.d1;else if(above===2)col=C.d0;else if(above===3)col=WC[0];
        else if(wf[(y+1)*W+x]>=1)col=FOAM;
        else{const q=f+(by(x,y)-.5)*0.1;col=q<0.45?WC[0]:q<0.75?WC[1]:q<0.93?WC[2]:WC[3]}}
      else if(f<1.2){col=(hash(x,y,3)>.9)?C.d4:C.d3}
      else if(pj<0){if(pj>-1.4)col=C.d1;else{const q=noise(x/9,y/9,5)+(by(x,y)-.5)*0.25;col=q>0.66?C.d3:q<0.26?C.d1:C.d2}}
      else if(inField(x,y)){const ly=y-FIELD[1],k=ly%10;if(x===FIELD[0]||x===FIELD[2]-1||y===FIELD[1]||y===FIELD[3]-1)col=C.d0;else col=k===0?C.d0:k===9?C.d2:hash(x,y,4)>.94?C.d0:C.d1}
      else if(pj<1.3)col=C.g1;
      else{const n=noise(x/52,y/52,1)*0.6+noise(x/16,y/16,2)*0.4;const q=n+(by(x,y)-.5)*0.16;col=q<0.33?C.g1:q<0.6?C.g2:C.g3}
      d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255}
    gg.putImageData(img,0,0);}
  const gr=painter(gg);
  // ----- entities
  const ents=[];const blocks=[];
  const block=(x0,y0,x1,y1)=>blocks.push([x0,y0,x1,y1]);
  const free=(x,y,m)=>{if(isPath(x,y)||isPath(x-m,y)||isPath(x+m,y)||isPath(x,y-m)||isPath(x,y+m))return false;if(wf[(Math.min(H-1,Math.max(0,y|0)))*W+(Math.min(W-1,Math.max(0,x|0)))]<1.6)return false;if(x>FIELD[0]-m-4&&x<FIELD[2]+m+4&&y>FIELD[1]-m-4&&y<FIELD[3]+m+4)return false;for(const b of blocks)if(x>b[0]-m&&x<b[2]+m&&y>b[1]-m&&y<b[3]+m)return false;return true};
  const shadowEll=(cx,cy,rx,ry,a)=>{gg.fillStyle=`rgba(18,40,22,${a})`;for(let y=-ry;y<=ry;y++){const w=Math.round(rx*Math.sqrt(1-(y*y)/(ry*ry)));gg.fillRect(Math.round(cx-w),Math.round(cy+y),w*2,1)}};
  // buildings
  const B={};
  const addB=(key,name,cv,x,y,base,door)=>{const oc=outlined(cv);const b={key,name,cv:oc,white:hoverSil(oc),x,y,w:oc.width,h:oc.height,base,door,doorT:0,inside:new Set()};B[key]=b;
    ents.push({y:base,kind:'b',b});block(x+2,y+30,x+oc.width-2,base+4);
    gg.fillStyle='rgba(18,40,22,.32)';for(let yy=base-26;yy<=base+5;yy++){const s=Math.round((yy-(base-26))*0.42);gg.fillRect(x+4-s,yy,oc.width-14,1)}};
  addB('farmhouse','Farmhouse',bFarmhouse(),409,175,265,[46,62,10,23]);
  addB('workshop','Developer Workshop',bWorkshop(),121,155,239,[32,52,26,28]);
  addB('library','Research Library',bLibrary(),635,151,243,[43,57,12,31]);
  addB('lab','Testing Laboratory',bLab(),706,399,481,[39,54,14,24]);
  // props
  const addP=(name,x,y,opt={})=>{const cv=PROPS[name]();const e={y:y+(opt.dy||0),kind:'p',name,cv,x:Math.round(x-cv.width/2),py:y-cv.height+1,anim:opt.anim};ents.push(e);block(x-cv.width/2,y-6,x+cv.width/2,y+2);shadowEll(x-3,y,cv.width/2,2,.25);return e};
  addP('board',426,312);addP('shipbin',492,305);addP('mailbox',486,282);
  const crtE=addP('crt',236,256,{anim:'crt'});
  addP('crate',108,246);addP('crate',114,236);addP('barrel',98,246);addP('logs',214,286);addP('barrel',226,234);
  const gearE=addP('gearbase',96,226,{anim:'gear'});
  addP('bench',746,266);addP('lamp',446,362,{anim:'lamp'});addP('lamp',708,322,{anim:'lamp'});addP('lamp',612,262,{anim:'lamp'});
  const teslaE=addP('tesla',698,478,{anim:'tesla'});const vatE=addP('vat',818,482,{anim:'vat'});
  addP('barrel',836,470);addP('crate',834,484);
  addP('well',372,250);addP('sign',254,358);
  addP('hay',356,520);addP('hay',362,532);addP('hay',350,546);addP('can',250,390);addP('pumpkins',358,404);
  const sc=PROPS.scarecrow();ents.push({y:478,kind:'p',cv:sc,x:288-9,py:478-sc.height+1});
  // dock + lilies (ground)
  gg.drawImage(PROPS.dock(),509,412);
  for(const [x,y] of [[470,480],[488,500],[560,460],[575,494],[455,462],[598,478],[540,500]]){gr(x,y,6,4,P.g1);gr(x+1,y,4,1,P.g2);gr(x,y+1,1,2,P.g0);gr(x+3,y,1,2,'#2a6a92');}
  for(const [x,y] of [[489,499],[561,459]]){gr(x+1,y-1,2,2,'#f4a9c4');gr(x+1,y-1,1,1,'#fff')}
  for(const [x,y] of [[448,428],[600,440],[606,456],[442,500],[592,514]]){const rc=makeRock(x+y,9,7);gg.drawImage(rc,x,y)}
  // farmhouse garden
  gr(418,270,30,18,P.d1);for(let y=272;y<286;y+=4)gr(419,y,28,1,P.d0);
  const tul=['#e8455a','#ffd36b','#f4a9c4','#e8455a','#ffffff','#9b6fd0','#ffd36b'];for(let i=0;i<7;i++)for(let j=0;j<3;j++){const x=420+i*4,y=272+j*5;gr(x,y+1,1,3,P.g1);gr(x-1,y+2,1,1,P.g2);gr(x,y,2,2,tul[(i+j)%7]);gr(x,y,1,1,'#fff6')}
  // fences
  const fenceH=(x0,x1,y)=>{for(let x=x0;x<x1;x++){gr(x,y-6,1,2,P.w3);gr(x,y-6,1,1,P.w4);gr(x,y-2,1,2,P.w3);gr(x,y-1,1,1,P.w1)}for(let x=x0;x<=x1;x+=8){gr(x-1,y-9,3,10,P.w2);gr(x-1,y-9,3,1,P.w4);gr(x+1,y-8,1,9,P.w1);gr(x-2,y-9,1,10,P.out);gr(x+2,y-9,1,10,P.out);gr(x-1,y-10,3,1,P.out);gr(x-3,y+1,6,1,'rgba(18,40,22,.3)')}};
  const fenceV=(x,y0,y1)=>{for(let y=y0;y<y1;y++){gr(x,y,2,1,P.w3);gr(x+2,y,1,1,P.w1)}for(let y=y0;y<=y1;y+=10){gr(x-1,y-6,4,8,P.w2);gr(x-1,y-6,4,1,P.w4);gr(x-2,y-6,1,8,P.out);gr(x+3,y-6,1,8,P.out);gr(x-1,y-7,4,1,P.out)}};
  fenceH(64,222,386);fenceH(244,344,386);fenceV(63,386,574);fenceV(343,386,574);fenceH(64,344,576);
  fenceH(414,448,292);
  // crops
  const crops=[];const rowsT=['wheat','wheat','carrot','cabbage','corn','tomato','pumpkin','carrot'];
  const cropC={};for(const t of CROP_TYPES)for(let s=0;s<4;s++)for(let w=0;w<2;w++)cropC[t+s+w]=cropSprite(t,s,w);
  for(let ri=0;ri<8;ri++){const y=410+ri*20;for(let x=84;x<330;x+=14){if(x>212&&x<252)continue;if(Math.abs(x-288)<12&&Math.abs(y-470)<14)continue;
    const c={x,y,type:rowsT[ri],stage:Math.min(3,Math.floor(R()*4.2)),seed:R()*10};crops.push(c);ents.push({y,kind:'c',c})}}
  // trees
  const treeTypes={oak:[],oak2:[],pine:[],blossom:[],apple:[]};
  for(let i=0;i<4;i++){treeTypes.oak.push(makeOak(11+i,PAL.oak));treeTypes.oak2.push(makeOak(31+i,PAL.oak2));treeTypes.pine.push(makePine(51+i))}
  treeTypes.blossom.push(makeOak(71,PAL.blossom),makeOak(72,PAL.blossom));treeTypes.apple.push(makeOak(81,PAL.oak,'#d8402e'),makeOak(82,PAL.oak2,'#d8402e'));
  const trees=[];
  const addT=(x,y,type,force)=>{if(!force&&!free(x,y,10))return false;for(const t of trees)if(Math.abs(t.x-x)<14&&Math.abs(t.y-y)<10)return false;
    const arr=treeTypes[type];const s=arr[(trees.length)%arr.length];const tr={x:Math.round(x),y:Math.round(y),s,ph:R()*6.28};trees.push(tr);ents.push({y:tr.y,kind:'t',t:tr});
    shadowEll(tr.x-8,tr.y,s.kind==='pine'?10:15,4,.3);block(x-6,y-6,x+6,y+3);return true};
  [[392,170,'oak'],[536,172,'oak2'],[606,232,'blossom'],[804,216,'blossom'],[620,404,'oak'],[70,286,'oak2'],[374,430,'apple'],[872,444,'oak'],[562,606,'oak2'],[300,610,'apple'],[880,560,'pine'],[30,560,'oak'],[400,604,'pine'],[640,580,'oak'],[90,180,'pine'],[860,290,'oak2'],[300,170,'apple']].forEach(([x,y,t])=>addT(x,y,t,true));
  for(let i=0;i<500;i++){const x=R()*1000-20,y=R()*112+20;addT(x,y,R()<.55?'pine':R()<.5?'oak':'oak2')}
  for(let i=0;i<500;i++){const side=R()<.5;const x=side?R()*56-12:W-R()*56+12,y=110+R()*520;if(Math.abs(y-336)<26)continue;addT(x,y,R()<.5?'pine':'oak')}
  for(let i=0;i<300;i++){const x=R()*W,y=H-R()*44+10;addT(x,y,R()<.4?'pine':R()<.5?'oak':'oak2')}
  for(let i=0;i<40;i++){const x=60+R()*840,y=140+R()*440;let ok=true;for(const k in B){const b=B[k];if(x>b.x-40&&x<b.x+b.w+40&&y>b.y&&y<b.base+50)ok=false}if(ok&&trees.length<9999&&(i%3===0))addT(x,y,R()<.5?'oak2':'oak')}
  // bushes, rocks
  const bushes=[makeBush(5,PAL.oak),makeBush(6,PAL.oak2,'#e8455a'),makeBush(7,PAL.oak,'#f4f0ff'),makeBush(8,PAL.oak2),makeBush(9,PAL.blossom)];
  for(let i=0,n=0;i<900&&n<46;i++){const x=40+R()*880,y=120+R()*480;if(!free(x,y,12))continue;const cv=bushes[n%bushes.length];ents.push({y,kind:'p',cv,x:Math.round(x-cv.width/2),py:Math.round(y-cv.height+1)});shadowEll(x-3,y,8,2,.25);block(x-8,y-5,x+8,y+2);n++}
  for(let i=0,n=0;i<600&&n<18;i++){const x=40+R()*880,y=120+R()*480;if(!free(x,y,8))continue;const cv=makeRock(i,8+(R()*6|0),6+(R()*4|0));ents.push({y,kind:'p',cv,x:Math.round(x-cv.width/2),py:Math.round(y-cv.height+1)});block(x-5,y-3,x+5,y+2);n++}
  // tufts & flowers & pebbles
  for(let i=0;i<2200;i++){const x=R()*W|0,y=R()*H|0;if(!free(x,y,2))continue;const k=R();
    if(k<.55){gr(x,y,1,2,P.g1);gr(x+2,y,1,2,P.g1);gr(x+1,y+1,1,2,P.g1);gr(x+1,y,1,1,P.g4)}
    else if(k<.8){gr(x,y,1,1,P.g4);gr(x+1,y+1,1,1,P.g4)}
    else{const fc=['#ffffff','#ffd36b','#f4a9c4','#b8a6f0','#e8455a','#ffffff'][R()*6|0];gr(x,y+1,1,1,P.g1);gr(x-1,y,1,1,fc);gr(x+1,y,1,1,fc);gr(x,y-1,1,1,fc);gr(x,y+1,1,1,fc);gr(x,y,1,1,'#ffe08a')}}
  for(let i=0;i<260;i++){const x=R()*W|0,y=R()*H|0;if(!isPath(x,y)||!isPath(x+2,y))continue;gr(x,y,2,1,P.s2);gr(x,y,1,1,P.s3);gr(x,y+1,2,1,P.d1)}
  // flower beds by library & lab
  for(const [x0,y0,w,h,cs] of [[646,250,28,10,['#f4a9c4','#ffffff','#b8a6f0']],[694,250,30,10,['#ffd36b','#e8455a','#ffffff']],[136,246,16,8,['#ffd36b','#ffffff']],[766,490,22,8,['#b8a6f0','#ffffff']]]){
    for(let i=0;i<w*h/6;i++){const x=x0+R()*w|0,y=y0+R()*h|0;gr(x,y+1,1,2,P.g1);gr(x,y,1,1,cs[R()*cs.length|0])}}
  // static sort cache
  const staticEnts=ents.slice();

  // ----- path graph
  const N={hd:[460,266],hj:[460,336],wd:[166,240],wj:[166,336],ld:[684,244],lj:[684,336],fj:[232,336],fg:[232,396],f1:[232,420],f2:[232,460],f3:[232,500],f4:[232,540],pj:[520,336],dk:[520,440],a1:[684,500],a2:[752,500],ad:[752,482]};
  const E=[['hd','hj'],['wd','wj'],['ld','lj'],['fj','fg'],['fg','f1'],['f1','f2'],['f2','f3'],['f3','f4'],['pj','dk'],['lj','a1'],['a1','a2'],['a2','ad'],['wj','fj'],['fj','hj'],['hj','pj'],['pj','lj']];
  const adj={};for(const k in N)adj[k]=[];for(const [a,b] of E){adj[a].push(b);adj[b].push(a)}
  const route=(from,to)=>{const prev={[from]:null},q=[from];while(q.length){const n=q.shift();if(n===to)break;for(const m of adj[n])if(!(m in prev)){prev[m]=n;q.push(m)}}const out=[];let c=to;while(c&&c!==from){out.unshift(c);c=prev[c]}return out};
  const ST={
    board:{p:[442,314],n:'hj',face:'left'},crt:{p:[236,268],n:'wj',face:'up'},visitBramble:{p:[220,268],n:'wj',face:'right'},
    readbench:{p:[746,268],n:'lj',face:'down'},visitJuniper:{p:[461,314],n:'hj',face:'left'},vat:{p:[818,494],n:'a2',face:'up'},
    visitClover:{p:[800,496],n:'a2',face:'right'},ship:{p:[476,306],n:'hj',face:'right'},nap:{p:[606,414],n:'pj',face:'down'},
    f1:{p:[232,420],n:'f1',face:'left'},f2:{p:[232,460],n:'f2',face:'right'},f3:{p:[232,500],n:'f3',face:'left'},f4:{p:[232,540],n:'f4',face:'right'},
    dock:{p:[520,444],n:'dk',face:'down'},hd:{p:N.hd,n:'hd',face:'up'},wd:{p:N.wd,n:'wd',face:'up'},ld:{p:N.ld,n:'ld',face:'up'},ad:{p:N.ad,n:'ad',face:'up'},
  };
  const DOOR_OF={farmhouse:'hd',workshop:'wd',library:'ld',lab:'ad'};

  // ----- agents
  const AG=[
    {id:'juniper',name:'Juniper',role:'Orchestrator',home:'Farmhouse',icon:'clip',tool:'clipboard',outfit:'vest',hat:'straw',
     pal:{skin:'#f1c6a0',skinD:'#d69a72',hair:'#6b3f22',hairD:'#4a2a16',shirt:'#efe6cf',shirtD:'#c8bb97',pants:'#5a4632',shoe:'#3b2216',acc:'#4c7a3a',hat:'#e8c36a',hatL:'#f6dc8e',hatD:'#b98f3e',band:'#c0443a'},
     tasks:['Planning the sprint 14 backlog','Triaging 6 new issues','Reviewing the roadmap','Drafting v2.3 release notes'],rate:3.2,
     done:['Juniper pinned the sprint 14 plan to the board','Juniper assigned issue #219 to Bramble','Juniper updated the roadmap','Juniper drafted the v2.3 release notes'],
     thinks:['who takes #221?','priorities…','sprint 14','✓ 4 of 7'],
     routine:[{go:'board'},{work:12},{go:'visitBramble'},{say:"How's the auth refactor going?",secs:3.6,reply:['bramble','Almost done!']},{go:'visitClover'},{say:'Are the v2.3 tests ready?',secs:3.6,reply:['clover','Running them now']},{go:'hd'},{inside:'farmhouse',secs:7}]},
    {id:'bramble',name:'Bramble',role:'Coding Agent',home:'Developer Workshop',icon:'gear',outfit:'apron',hat:'cap',
     pal:{skin:'#c98d5e',skinD:'#a8703f',hair:'#2e1f18',hairD:'#1e130e',shirt:'#4f7fc4',shirtD:'#3a619c',pants:'#4a4458',shoe:'#2a1d1a',acc:'#8a5a34',hat:'#c0443a',hatL:'#e0645a',hatD:'#8e2f27'},
     tasks:['Refactoring the auth middleware','Fixing a race in the job queue','Adding pagination to /orders','Upgrading to Node 22'],rate:2.6,
     done:['Bramble opened PR #482: auth middleware refactor','Bramble fixed the job queue race (#219)','Bramble pushed pagination for /orders','Bramble upgraded the runtime to Node 22'],
     thinks:['off-by-one?','git rebase…','types ok','refactor!'],
     routine:[{go:'crt'},{work:16},{go:'wd'},{inside:'workshop',secs:5},{go:'crt'},{work:12},{go:'visitClover'},{say:'New build is ready to test!',secs:3.6,reply:['clover','On it!']}]},
    {id:'wren',name:'Wren',role:'Research Agent',home:'Research Library',icon:'book',outfit:'cardigan',hat:'flower',long:true,
     pal:{skin:'#f4d2b4',skinD:'#dcae8a',hair:'#5a3368',hairD:'#3e2148',shirt:'#d9a441',shirtD:'#b08030',pants:'#6b4a8a',shoe:'#3b2216',acc:'#f3e2b8'},
     tasks:['Comparing 3 caching strategies','Reading up on rate limiting','Summarizing user interviews','Surveying vector DB options'],rate:2.8,
     done:['Wren published notes on caching strategies','Wren summarized 12 sources on rate limiting','Wren shared 5 themes from user interviews','Wren compared 4 vector databases'],
     thinks:['interesting…','cite this','LRU vs LFU','hmm!'],
     routine:[{go:'readbench'},{work:14,pose:'read'},{go:'visitJuniper'},{say:'My notes are on the board.',secs:3.6,reply:['juniper','Thanks, Wren!']},{go:'ld'},{inside:'library',secs:9}]},
    {id:'clover',name:'Clover',role:'Testing Agent',home:'Testing Laboratory',icon:'flask',outfit:'coat',hat:'goggles',
     pal:{skin:'#e8b48c',skinD:'#c98f66',hair:'#3f9096',hairD:'#2a6d73',shirt:'#f0f2f4',shirtD:'#c4cad2',pants:'#3e4a5e',shoe:'#2a1d1a',acc:'#7fd4a8'},
     tasks:['Running the integration suite','Hunting a flaky checkout test','Load testing /search','Writing e2e tests for login'],rate:2.9,
     done:['Clover: integration suite 48/48 passing','Clover found and fixed a flaky checkout test','Clover: /search holds 1.2k req/s','Clover added 9 e2e tests for login'],
     thinks:['flaky?','48/48 ✓','retry…','bubbling!'],
     routine:[{go:'vat'},{work:14},{go:'ad'},{inside:'lab',secs:7},{go:'vat'},{work:10},{go:'visitBramble'},{say:'2 tests are failing in auth.',secs:3.6,reply:['bramble','Fixing it now!']}]},
    {id:'pip',name:'Pip',role:'Release Agent',home:'Farming Fields',icon:'sprout',outfit:'overalls',hat:'bandana',
     pal:{skin:'#8f5a3a',skinD:'#6e4128',hair:'#1e1410',hairD:'#120b08',shirt:'#d0503a',shirtD:'#a63a2a',pants:'#3f6fa8',shoe:'#3b2216',acc:'#3f6fa8',hat:'#f0c24a',hatD:'#c49a2c'},
     tasks:['Growing build v2.3.1','Tending the staging deploy','Harvesting the release candidate'],rate:4.2,
     done:['Pip deployed v2.3.1 to staging','Pip promoted the release candidate','Pip harvested build v2.3.2'],
     thinks:['grow, build!','ripe soon','CI green'],
     routine:[{go:'f1'},{work:5,pose:'water'},{go:'f2'},{work:5,pose:'water'},{go:'f3'},{work:5,pose:'water'},{go:'f4'},{work:5,pose:'water'},{go:'ship'},{say:'Shipped to staging!',secs:3,toast:true}]},
    {id:'moss',name:'Moss',role:'Docs Agent',home:'Pond Oak',icon:'quill',outfit:'sweater',hat:'beanie',
     pal:{skin:'#f0c8a8',skinD:'#d4a07c',hair:'#a0643a',hairD:'#7a4a28',shirt:'#7a8a4a',shirtD:'#5c6a36',pants:'#5c3720',shoe:'#2a1d1a',acc:'#94a85a',hat:'#3c7d8a',hatD:'#2a5c66'},
     tasks:['Resting until the docs build is queued','Updating the API reference','Proofreading the changelog'],rate:0,
     done:['Moss updated the API reference','Moss proofread the changelog'],
     thinks:['zzz'],
     routine:[{go:'nap'},{sleep:26},{go:'ld'},{inside:'library',secs:9,toast:true}]},
  ];
  const agents=AG.map((d,i)=>{const first=ST[d.routine[0].go];return Object.assign(d,{seed:i*1.37,x:first.p[0],y:first.p[1],node:first.n,dir:first.face,mode:'idle',pose:'idle',path:[],ri:1,timer:0,t:0,frame:0,hidden:false,bubble:null,progress:15+R()*50,taskI:0,doneI:0,energy:60+R()*35|0,logs:[],thinkT:4+R()*8})});
  const AM={};agents.forEach(a=>AM[a.id]=a);
  let liveMode=true;
  const slots=new Map();
  const slotIds=agents.map(a=>a.id);
  function receiveLive(event){
    if(!event || !event.sessionId) return;
    const key=event.sessionId+':'+(event.agentId||'main');
    if(!slots.has(key)){
      const used=new Set(slots.values());
      const free=slotIds.find(id=>!used.has(id));
      if(!free) return;
      slots.set(key,free);
    }
    const a=AM[slots.get(key)];
    const labels={SessionStart:'Session started',SessionEnd:'Session ended',SubagentStart:'Subagent started',SubagentStop:'Subagent stopped',PreToolUse:'Using tool',PostToolUse:'Tool completed',PostToolUseFailure:'Tool failed',Stop:'Response completed',UserPromptSubmit:'New request',Notification:'Notification'};
    a.name=event.agentName||event.agentType||event.agentId||('Claude '+(slots.size));
    a.role=event.project||'Claude Code';
    a.task=(labels[event.type]||event.type)+(event.toolName?' · '+event.toolName:'');
    a.liveStatus=event.type==='SessionEnd'||event.type==='SubagentStop'||event.type==='Stop'?'idle':event.type==='PostToolUseFailure'?'error':'working';
    a.mode=a.liveStatus==='working'?'work':'idle';
    a.pose=a.liveStatus==='working'?'work':'idle';
    if(a.liveStatus==='working')a.dir='down';
    a.progress=a.liveStatus==='idle'?100:40;
    a.energy=90;
    a.hidden=false;
    a.bubble={text:event.type==='PostToolUseFailure'?'!':event.type==='Stop'?'✓':'...',t:2,kind:'say'};
    log(a,a.task);
    cfg.onChange&&cfg.onChange();
    if(event.type==='SubagentStart'||event.type==='PostToolUseFailure')cfg.onToast&&cfg.onToast({agentId:a.id,name:a.name,text:a.task,time:fmt(clock.m)});
  }

  let speed=1;
  const clock={m:8*60+42};
  const fmt=m=>{m=Math.floor(m)%1440;const h=Math.floor(m/60),mm=m%60;return `${((h+11)%12)+1}:${String(mm).padStart(2,'0')} ${h<12?'AM':'PM'}`};
  const log=(a,text)=>{a.logs.unshift({time:fmt(clock.m),text});if(a.logs.length>5)a.logs.pop()};
  const seedLogs={juniper:['Checked in with Wren','Reviewed PR #478'],bramble:['Pushed 3 commits to feat/auth','Ran the linter'],wren:['Read 4 papers on caching','Borrowed "Designing Data Systems"'],clover:['Ran the smoke suite','Filed bug #224'],pip:['Watered build v2.3.1','Shipped hotfix v2.3.0-1'],moss:['Wrote the v2.2 changelog','Dozed off under the oak']};
  agents.forEach(a=>{seedLogs[a.id].forEach((t,i)=>a.logs.push({time:fmt(clock.m-14-i*23),text:t}))});
  const toast=(a,text)=>{cfg.onToast&&cfg.onToast({agentId:a.id,name:a.name,text,time:fmt(clock.m)})};
  const changed=a=>{cfg.onChange&&cfg.onChange(a.id)};
  // initial modes
  agents.forEach(a=>{if(liveMode){a.mode='idle';a.pose='sit';}else{const s=a.routine[1];applyStep(a,s,true)}});
  function applyStep(a,s,init){
    a.step=s;
    if(s.go){const st=ST[s.go];const nodes=route(a.node,st.n).map(k=>N[k]);a.path=[N[a.node],...nodes,st.p];a.target=st;a.mode='walk';a.pose='walk';a.node=st.n;a.destName=s.go;}
    else if(s.work){a.mode='work';a.pose=s.pose||'work';a.timer=s.work;a.dir=a.target?a.target.face:a.dir;}
    else if(s.say){a.mode='talk';a.pose='talk';a.timer=s.secs;a.dir=a.target?a.target.face:a.dir;a.bubble={text:s.say,t:s.secs,kind:'say'};
      if(s.reply){const o=AM[s.reply[0]];setTimeout(()=>{if(o.mode!=='walk'&&!o.hidden)o.bubble={text:s.reply[1],t:2.4,kind:'say'}},1500/(speed||1));log(a,`Checked in with ${o.name}`)}
      if(s.toast){const msg=a.done[a.doneI%a.done.length];a.doneI++;toast(a,msg);log(a,msg.replace(a.name+' ',''))}}
    else if(s.inside){const b=B[s.inside];a.mode='inside';a.pose='idle';a.timer=s.secs;a.hidden=true;b.inside.add(a.id);b.doorT=0.9;a.inB=s.inside}
    else if(s.sleep){a.mode='sleep';a.pose='sleep';a.timer=s.sleep;a.dir='down';a.bubble=null}
    if(!init)changed(a);
  }
  function nextStep(a){
    const s=a.step;
    if(s&&s.inside){const b=B[s.inside];b.inside.delete(a.id);b.doorT=0.9;a.hidden=false;a.dir='down';
      if(s.toast){const msg=a.done[a.doneI%a.done.length];a.doneI++;toast(a,msg);log(a,msg.replace(a.name+' ',''))}}
    if(s&&s.sleep){a.energy=100;log(a,'Woke up refreshed')}
    a.bubble=a.bubble&&a.bubble.kind==='say'&&a.mode==='talk'?null:a.bubble;
    const n=a.routine[a.ri];a.ri=(a.ri+1)%a.routine.length;applyStep(a,n);
  }
  function simAgent(a,dt){
    a.t+=dt;
    if(a.bubble){a.bubble.t-=dt;if(a.bubble.t<=0)a.bubble=null}
    if(a.mode==='walk'){
      let move=26*dt;
      while(move>0&&a.path.length){const [tx,ty]=a.path[0];const dx=tx-a.x,dy=ty-a.y;
        if(Math.abs(dx)>0.01){const m=Math.min(Math.abs(dx),move);a.x+=Math.sign(dx)*m;move-=m;a.dir=dx>0?'right':'left'}
        else if(Math.abs(dy)>0.01){const m=Math.min(Math.abs(dy),move);a.y+=Math.sign(dy)*m;move-=m;a.dir=dy>0?'down':'up'}
        else{a.x=tx;a.y=ty;a.path.shift()}}
      a.frame=Math.floor(a.t*7);
      if(!a.path.length){a.dir=a.target.face;nextStep(a)}
      return;
    }
    if(a.mode==='work'){
      a.progress+=dt*a.rate;a.energy=Math.max(8,a.energy-dt*0.35);
      a.thinkT-=dt;if(a.thinkT<=0&&!a.bubble){a.thinkT=9+Math.random()*9;a.bubble={text:a.thinks[Math.random()*a.thinks.length|0],t:2.6,kind:'think'}}
      if(a.progress>=100){a.progress=0;const msg=a.done[a.doneI%a.done.length];a.doneI++;toast(a,msg);log(a,msg.replace(a.name+' ',''));a.taskI=(a.taskI+1)%a.tasks.length;changed(a)}
      if(a.id==='pip'){for(const c of crops)if(Math.abs(c.y-a.y)<14&&Math.abs(c.x-a.x)<70&&Math.random()<dt*0.05&&c.stage<3)c.stage++}
    }
    if(a.mode==='inside')a.energy=Math.min(100,a.energy+dt*1.5);
    if(a.mode==='sleep'){a.energy=Math.min(100,a.energy+dt*2)}
    if(a.mode!=='walk'){a.timer-=dt;if(a.timer<=0)nextStep(a)}
  }
  // ----- critters
  const chickens=[0,1,2].map(i=>({x:340+i*18,y:280+i*10,tx:0,ty:0,st:'idle',t:Math.random()*3,dir:1,col:i===2?'#c98f52':'#fbf6ea'}));
  const ducks=[{a:0,sp:.12,cx:520,cy:470,rx:46,ry:20},{a:2.4,sp:.09,cx:510,cy:478,rx:34,ry:14},{a:4,sp:.1,cx:525,cy:472,rx:40,ry:18}];
  const butterflies=Array.from({length:9},(_,i)=>({cx:[430,660,700,300,560,140,820,400,250][i],cy:[280,262,300,300,400,280,330,450,360][i],a:R()*6,b:R()*6,col:['#ffffff','#ffd36b','#f4a9c4','#b8e0ff','#ffffff','#ffb060','#ffd36b','#e6d0ff','#ffffff'][i]}));
  const sparkles=[];for(let i=0;i<70;i++){const x=440+R()*170|0,y=430+R()*85|0;if(wf[y*W+x]<0.8)sparkles.push({x,y,ph:R()*6.28,sp:.8+R()*1.5})}
  const smoke=[];const leaves=[];let birds=null,birdT=6;const ripples=[];let rippleT=3;
  const clouds=[0,1,2].map(i=>({x:R()*W,y:80+i*200+R()*80,s:.8+R()*.5}));
  const [cloudCv,cg]=mk(140,70);{for(let y=0;y<70;y++)for(let x=0;x<140;x++){const dx=(x-70)/70,dy=(y-35)/35;const v=1-(dx*dx+dy*dy)+(noise(x/14,y/14,13)-.5)*0.8;if(v>0.15+by(x,y)*0.3){cg.fillStyle='rgba(20,30,60,1)';cg.fillRect(x,y,1,1)}}}
  // glow sprite
  const glowCache={};
  const glowSprite=(col,rad)=>{const k=col+rad;if(glowCache[k])return glowCache[k];const s=rad*2;const [c,g]=mk(s,s);const [cr,cgc,cb]=hexRgb(col);for(let y=0;y<s;y++)for(let x=0;x<s;x++){const d=Math.hypot(x+.5-rad,y+.5-rad)/rad;if(d>1)continue;const lvl=d<.35?0.55:d<.65?0.3:0.13;if(d>.65&&by(x,y)>.6)continue;g.fillStyle=`rgba(${cr},${cgc},${cb},${lvl})`;g.fillRect(x,y,1,1)}glowCache[k]=c;return c};
  const glows=[[B.farmhouse,[[24,60],[76,60],[61,66],[50,24]],'#ffc870',10],[B.workshop,[[73,56]],'#ffb050',10],[B.library,[[22,66],[74,66],[48,24]],'#ffd27a',11],[B.lab,[[21,55],[69,55],[45,59]],'#8ff0c4',12]];
  const lamps=[[446,340],[708,300],[612,240]];
  // icons
  const icon5={};for(const k in ICON5)icon5[k]=mapCanvas(ICON5[k][0],ICON5[k][1],P.out);

  // ----- camera & input
  const cam={x:470,y:330,z:2,tz:2,anchor:null};
  let dpr=1,vw=0,vh=0;let hover=null;let selected=null;let follow=false;let mode='select';let paused=false;let opts=cfg.getOpts?cfg.getOpts():{};
  const resize=()=>{const r=canvas.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);vw=r.width;vh=r.height;canvas.width=Math.max(1,Math.round(vw*dpr));canvas.height=Math.max(1,Math.round(vh*dpr));
    if(!cam.init){cam.init=true;const z=Math.max(0.5,Math.min(2,Math.min(vw/W,vh/H)));cam.z=cam.tz=z;}};
  const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
  const scale=()=>cam.z*dpr;
  const toWorld=(sx,sy)=>{const s=scale();return [(sx*dpr-canvas.width/2)/s+cam.x,(sy*dpr-canvas.height/2)/s+cam.y]};
  const clampCam=()=>{const s=scale();const hw=canvas.width/2/s,hh=canvas.height/2/s;cam.x=hw*2>=W?W/2:Math.max(hw,Math.min(W-hw,cam.x));cam.y=hh*2>=H?H/2:Math.max(hh,Math.min(H-hh,cam.y))};
  const hitAgent=(wx,wy)=>{let best=null;for(const a of agents){if(a.hidden)continue;if(wx>=a.x-7&&wx<=a.x+7&&wy>=a.y-20&&wy<=a.y+2){if(!best||a.y>best.y)best=a}}return best};
  const hitBuilding=(wx,wy)=>{for(const k in B){const b=B[k];if(wx>=b.x+4&&wx<=b.x+b.w-4&&wy>=b.y+4&&wy<=b.base)return b}return null};
  let down=null;const keys={};
  const onDown=e=>{canvas.setPointerCapture(e.pointerId);down={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,moved:false}};
  const onMove=e=>{const r=canvas.getBoundingClientRect();const sx=e.clientX-r.left,sy=e.clientY-r.top;
    if(down){const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.abs(dx)+Math.abs(dy)>4)down.moved=true;if(down.moved){cam.x=down.cx-dx/cam.z;cam.y=down.cy-dy/cam.z;follow=false;cfg.onFollow&&cfg.onFollow(false);clampCam()}}
    const [wx,wy]=toWorld(sx,sy);const a=hitAgent(wx,wy);hover=a?{type:'a',a}:(()=>{const b=hitBuilding(wx,wy);return b?{type:'b',b,sx,sy}:null})();
    canvas.style.cursor=down&&down.moved?'grabbing':mode==='pan'?'grab':hover&&hover.type==='a'?'pointer':'default'};
  const onUp=e=>{if(down&&!down.moved&&mode==='select'){const r=canvas.getBoundingClientRect();const [wx,wy]=toWorld(e.clientX-r.left,e.clientY-r.top);const a=hitAgent(wx,wy);select(a?a.id:null)}down=null;canvas.style.cursor=mode==='pan'?'grab':'default'};
  const onWheel=e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoomAt(e.deltaY<0?1:-1,e.clientX-r.left,e.clientY-r.top)};
  const onLeave=()=>{hover=null};
  const onKey=e=>{if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;keys[e.key.toLowerCase()]=e.type==='keydown'};
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointerleave',onLeave);canvas.addEventListener('wheel',onWheel,{passive:false});
  window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKey);
  function zoomAt(dirn,sx,sy){const nz=Math.max(0.5,Math.min(6,cam.tz+dirn*0.25));if(nz===cam.tz)return;cam.tz=nz;if(sx==null){sx=vw/2;sy=vh/2}const [wx,wy]=toWorld(sx,sy);cam.anchor={wx,wy,sx,sy}}
  function select(id){selected=id?AM[id]:null;if(!id){follow=false}cfg.onSelect&&cfg.onSelect(id);window.dispatchEvent(new CustomEvent('farm-select',{detail:id}))}

  // ----- render
  let last=performance.now(),raf=0,T=0;
  const lightFor=tod=>({Morning:{mul:'#fff0dc',add:'rgba(255,196,120,0.07)',dark:0.1},Noon:{mul:null,add:null,dark:0},Dusk:{mul:'#ffbf94',add:'rgba(255,120,60,0.06)',dark:0.55},Night:{mul:'#5664a6',add:null,dark:1}})[tod]||{mul:'#fff0dc',dark:0.1};
  function frame(now){try{frameInner(now)}catch(err){window.__farmErr=(err&&err.stack)||String(err);console.error(err)}raf=requestAnimationFrame(frame)}
  function frameInner(now){
    const rdt=Math.min(0.05,(now-last)/1000);last=now;opts=cfg.getOpts?cfg.getOpts():opts;speed=opts.simSpeed||1;
    const dt=paused?0:rdt*speed;T+=dt;clock.m+=dt*(1/1.2);
    if(!liveMode) agents.forEach(a=>simAgent(a,dt));
    else agents.forEach(a=>{a.t+=dt;if(a.bubble){a.bubble.t-=dt;if(a.bubble.t<=0)a.bubble=null}});
    simCritters(dt);
    for(const k in B)B[k].doorT=Math.max(0,B[k].doorT-rdt);
    // keys pan
    const kp=280*rdt/cam.z;if(keys['w']||keys['arrowup'])cam.y-=kp;if(keys['s']||keys['arrowdown'])cam.y+=kp;if(keys['a']||keys['arrowleft'])cam.x-=kp;if(keys['d']||keys['arrowright'])cam.x+=kp;
    if(Object.values(keys).some(Boolean)&&(keys['w']||keys['a']||keys['s']||keys['d']||keys['arrowup']||keys['arrowdown']||keys['arrowleft']||keys['arrowright'])&&follow){follow=false;cfg.onFollow&&cfg.onFollow(false)}
    // zoom anim
    if(Math.abs(cam.z-cam.tz)>0.001){cam.z+= (cam.tz-cam.z)*Math.min(1,rdt*12);if(Math.abs(cam.z-cam.tz)<0.01)cam.z=cam.tz;
      if(cam.anchor&&!follow){const s=scale();cam.x=cam.anchor.wx-(cam.anchor.sx*dpr-canvas.width/2)/s;cam.y=cam.anchor.wy-(cam.anchor.sy*dpr-canvas.height/2)/s}}
    else cam.anchor=null;
    if(follow&&selected){cam.x+=(selected.x-cam.x)*Math.min(1,rdt*4);cam.y+=(selected.y-12-cam.y)*Math.min(1,rdt*4)}
    clampCam();
    render();
    if(cfg.portrait){const pc=cfg.portrait();if(pc&&selected)drawPortrait(pc,selected)}
  }
  function simCritters(dt){
    for(const c of chickens){c.t-=dt;if(c.st==='walk'){const dx=c.tx-c.x,dy=c.ty-c.y,d=Math.hypot(dx,dy);if(d<1||c.t<=0){c.st=Math.random()<.6?'peck':'idle';c.t=1+Math.random()*2.5}else{c.x+=dx/d*12*dt;c.y+=dy/d*12*dt;c.dir=dx>0?1:-1}}
      else if(c.t<=0){c.st='walk';c.tx=332+Math.random()*68;c.ty=268+Math.random()*44;c.t=4}}
    for(const d of ducks)d.a+=d.sp*dt;
    rippleT-=dt;if(rippleT<=0){rippleT=3+Math.random()*5;const s=sparkles[Math.random()*sparkles.length|0];ripples.push({x:s.x,y:s.y,t:0})}
    for(let i=ripples.length-1;i>=0;i--){ripples[i].t+=dt;if(ripples[i].t>1.6)ripples.splice(i,1)}
    if(Math.random()<dt*3)smoke.push({x:B.farmhouse.x+76+Math.random()*2,y:B.farmhouse.y-1,t:0,s:1});
    if(Math.random()<dt*2)smoke.push({x:B.workshop.x+78,y:B.workshop.y,t:0,s:.8});
    for(let i=smoke.length-1;i>=0;i--){const p=smoke[i];p.t+=dt;p.y-=dt*7;p.x+=dt*(3+Math.sin(p.t*2)*2);if(p.t>4)smoke.splice(i,1)}
    if(Math.random()<dt*0.8){const tr=trees.find(t=>t.s.kind!=='pine'&&t.y>150&&t.y<620&&Math.random()<.1);if(tr)leaves.push({x:tr.x-10+Math.random()*20,y:tr.y-30,t:0,col:tr.s===treeTypes.blossom[0]||tr.s===treeTypes.blossom[1]?'#f4a9c4':'#80c25a',ph:Math.random()*6})}
    for(let i=leaves.length-1;i>=0;i--){const l=leaves[i];l.t+=dt;l.y+=dt*8;l.x+=Math.sin(l.t*3+l.ph)*dt*10-dt*3;if(l.t>3.5)leaves.splice(i,1)}
    birdT-=dt;if(!birds&&birdT<=0){birds={x:-30,y:120+Math.random()*300,t:0}}if(birds){birds.t+=dt;birds.x+=dt*48;birds.y-=dt*6;if(birds.x>W+40){birds=null;birdT=14+Math.random()*16}}
    for(const c of clouds){c.x+=dt*4*c.s;if(c.x>W+80)c.x=-220}
    if(Math.random()<dt*0.04){const c=crops.find(c=>c.stage<2&&Math.random()<.08);if(c)c.stage++}
    if(Math.random()<dt*0.03){const c=crops.find(c=>c.stage===3&&Math.random()<.04);if(c)c.stage=0}
  }
  const shadowAt=(x,y,w)=>{ctx.fillStyle='rgba(18,32,14,.28)';ctx.fillRect(x-w/2,y,w,1)};
  function drawEnt(e){
    const t=T;
    if(e.kind==='b'){const b=e.b;if(hover&&hover.type==='b'&&hover.b===b)ctx.drawImage(b.white,b.x-1,b.y-1);ctx.drawImage(b.cv,b.x,b.y);
      const [dx,dy,dw,dh]=b.door;if(b.doorT>0){const open=Math.sin(Math.min(1,b.doorT/0.9)*Math.PI);const ox=b.x+1+dx,oy=b.y+1+dy;ctx.fillStyle='#1a100c';ctx.fillRect(ox,oy,dw,dh);ctx.fillStyle='rgba(255,200,110,.35)';ctx.fillRect(ox+1,oy+dh-6,dw-2,6);const pw=Math.max(1,Math.round(dw*(1-open*0.8)));ctx.fillStyle=P.w2;ctx.fillRect(ox,oy,Math.min(pw,dw),dh);ctx.fillStyle=P.w1;ctx.fillRect(ox+pw-1,oy,1,dh)}
      if(b.key==='workshop'&&Math.floor(t*2)%2===0){ctx.fillStyle='rgba(255,230,160,.5)';ctx.fillRect(b.x+68,b.y+52,12,10)}
      if(b.key==='lab'){const k=(Math.sin(t*2.2)+1)/2;ctx.fillStyle=`rgba(200,255,230,${0.15+k*0.3})`;ctx.fillRect(b.x+16,b.y+50,12,11);ctx.fillRect(b.x+64,b.y+50,12,11);
        if(Math.floor(t*1.5)%2){ctx.fillStyle='#ff5a4a';ctx.fillRect(b.x+71,b.y+1,3,3);ctx.fillStyle='#ffd0c8';ctx.fillRect(b.x+72,b.y+1,1,1)}else{ctx.fillStyle='#7a2a22';ctx.fillRect(b.x+71,b.y+1,3,3)}}
      if(b.inside.size&&(b.key==='farmhouse'||b.key==='library')){ctx.fillStyle='rgba(255,220,140,.35)';const ws=b.key==='farmhouse'?[[19,56],[71,56]]:[[16,60],[68,60]];for(const [x,y] of ws)ctx.fillRect(b.x+x,b.y+y,12,8)}
      return}
    if(e.kind==='t'){const tr=e.t,s=tr.s;const sw=Math.sin(t*1.3+tr.ph)>0.55?1:0;
      const tw=s.trunk.width;ctx.drawImage(s.trunk,tr.x-tw/2|0,tr.y-s.trunk.height+1);
      const cv=s.c[sw];const top=s.kind==='pine'?tr.y-s.trunk.height-cv.height+6:tr.y-s.trunk.height-cv.height+12;ctx.drawImage(cv,tr.x-(s.c[0].width/2|0),top);return}
    if(e.kind==='c'){const c=e.c;const tall=c.type==='corn'||c.type==='wheat';const sw=tall&&Math.sin(t*1.6+c.x*0.08)>0.4?1:0;ctx.drawImage(cropC[c.type+c.stage+sw],c.x-7,c.y-25);return}
    if(e.kind==='p'){ctx.drawImage(e.cv,e.x,e.py);
      if(e.anim==='crt'){const sx=e.x+9,sy=e.py+3;const on=selected||true;for(let i=0;i<5;i++){const ln=(Math.floor(t*3)+i)%9;const w=2+((ln*7)%8);ctx.fillStyle=['#7be0a0','#ffd36b','#76b9e6','#f4a9c4'][ln%4];ctx.fillRect(sx+1+(ln%3),sy+1+i,Math.min(w,10-(ln%3)),1)}if(Math.floor(t*2)%2){ctx.fillStyle='#e6fff0';ctx.fillRect(sx+2,sy+5,2,1)}}
      if(e.anim==='gear'){const cx=e.x+11,cy=e.py-4,a=t*1.4;ctx.fillStyle=P.out;ctx.fillRect(cx-6,cy-6,13,13);ctx.fillStyle=P.s2;for(let k=0;k<8;k++){const an=a+k*Math.PI/4;const tx=Math.round(cx+Math.cos(an)*6),ty=Math.round(cy+Math.sin(an)*6);ctx.fillStyle=P.s1;ctx.fillRect(tx-1,ty-1,3,3)}
        ctx.fillStyle=P.s3;ctx.fillRect(cx-4,cy-4,9,9);ctx.fillStyle=P.s2;ctx.fillRect(cx-3,cy-3,7,7);ctx.fillStyle=P.s0;ctx.fillRect(cx-1,cy-1,3,3);ctx.fillStyle=P.s4;ctx.fillRect(cx-3,cy-4,3,1);
        const k2=Math.floor(t*4)%2;ctx.fillStyle=P.s0;ctx.fillRect(cx+Math.round(Math.cos(a)*2),cy+Math.round(Math.sin(a)*2),1,1)}
      if(e.anim==='tesla'&&Math.floor(t*7)%3===0){ctx.fillStyle='#c8f4ff';let x=e.x+6,y=e.py+3;for(let i=0;i<5;i++){x+=Math.random()<.5?-1:1;y-=1;ctx.fillRect(x,y,1,1)}ctx.fillStyle='rgba(180,240,255,.5)';ctx.fillRect(e.x+3,e.py+1,7,6)}
      if(e.anim==='vat'){for(let i=0;i<4;i++){const ph=(t*0.7+i*0.27)%1;ctx.fillStyle='#d8ffe6';ctx.fillRect(e.x+4+i*3,Math.round(e.py+16-ph*9),1,1)}}
      return}
    if(e.kind==='a'){const a=e.a;drawAgentFull(a)}
    if(e.kind==='k'){const c=e.k;const x=Math.round(c.x),y=Math.round(c.y);ctx.fillStyle='rgba(18,32,14,.28)';ctx.fillRect(x-4,y,8,1);
      const f=c.dir<0,hy=(c.st==='peck'&&Math.floor(T*4)%2)?3:0;const q=(dx,dy,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(f?x-dx-w:x+dx,y+dy,w,h)};
      q(-5,-7,2,3,P.out);q(-4,-6,7,6,P.out);q(1,-9+hy,4,5,P.out);q(-3,-5,5,4,c.col);q(-4,-6,1,1,c.col);q(2,-8+hy,2,3,c.col);q(2,-9+hy,2,1,'#e8455a');q(5,-7+hy,1,1,'#f0a030');q(3,-7+hy,1,1,P.out);q(-2,-3,3,1,'rgba(0,0,0,.12)');q(-1,0,1,1,'#f0a030');q(1,0,1,1,'#f0a030')}
  }
  const scratch=mk(28,30);
  function drawAgentFull(a){
    const X=Math.round(a.x)-6,Y=Math.round(a.y)-17;
    if(hover&&hover.type==='a'&&hover.a===a||selected===a){const [sc,sg]=scratch;sg.clearRect(0,0,28,30);drawAgent(sg,8,6,a,a.dir,a.frame,a.pose,a.t);sg.globalCompositeOperation='source-in';sg.fillStyle=selected===a?'#ffe08a':'#fff6d8';sg.fillRect(0,0,28,30);sg.globalCompositeOperation='source-over';
      for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])ctx.drawImage(sc,X-8+dx,Y-6+dy)}
    if(selected===a){const k=Math.floor(T*3)%2;ctx.fillStyle='#ffe08a';ctx.fillRect(X+1-k,Y+19,10+2*k,1);ctx.fillRect(X-k,Y+17,1,2);ctx.fillRect(X+11+k,Y+17,1,2)}
    drawAgent(ctx,X,Y,a,a.dir,a.frame,a.pose,a.t);
  }
  function drawLabel(a){
    if(a.hidden)return;const X=Math.round(a.x),Y=Math.round(a.y)-17+(a.pose==='sleep'||a.pose==='read'||a.pose==='sit'?2:0);
    const txt=a.name.toUpperCase(),tw=txt.length*4-1,pw=tw+9,px=X-Math.floor(pw/2),py=Y-10;
    ctx.fillStyle=selected===a?'#a8441f':'rgba(42,29,26,.82)';ctx.fillRect(px+1,py,pw-2,7);ctx.fillRect(px,py+1,pw,5);
    const sc={work:'#7be05a',walk:'#ffd36b',talk:'#ec8744',inside:'#76b9e6',sleep:'#b8a6f0',idle:'#ffd36b'}[a.mode];
    ctx.fillStyle=sc;ctx.fillRect(px+2,py+2,3,3);drawText(ctx,px+6,py+1,txt,'#f3e2b8');
    if(a.mode==='work'){const ic=icon5[a.icon];ctx.drawImage(ic,X-3,py-9+(Math.floor(T*2)%2))}
    if(a.mode==='sleep'){for(let i=0;i<3;i++){const ph=(T*0.5+i/3)%1;const zx=X+3+Math.round(ph*6+Math.sin(ph*6)*1.5),zy=py-7-Math.round(ph*12);ctx.globalAlpha=1-ph;drawText(ctx,zx,zy,'Z','#f3e2b8');ctx.globalAlpha=1}}
  }
  function bubbleScreen(a,sx,sy,s){
    const b=a.bubble;const fs=Math.round(11*dpr);ctx.font=`${fs}px "Pixelify Sans", monospace`;const tw=Math.ceil(ctx.measureText(b.text).width);const u=Math.max(2,Math.round(dpr*2));
    const padX=6*dpr,bw=tw+padX*2,bh=fs+8*dpr;const bx=Math.round(sx-bw/2),by_=Math.round(sy-bh-6*u);
    const box=(x,y,w,h,fill,edge)=>{ctx.fillStyle=edge;ctx.fillRect(x+u,y,w-2*u,h);ctx.fillRect(x,y+u,w,h-2*u);ctx.fillStyle=fill;ctx.fillRect(x+u,y+u,w-2*u,h-2*u)};
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(bx+u,by_+u*2,bw,bh);
    if(b.kind==='think'){box(bx,by_,bw,bh,'#fbf3dc',P.out);box(Math.round(sx-u*2),by_+bh+u,u*4,u*4,'#fbf3dc',P.out);box(Math.round(sx-u),by_+bh+u*6,u*2+u,u*2+u,'#fbf3dc',P.out)}
    else{box(bx,by_,bw,bh,P.cream,P.out);ctx.fillStyle=P.out;ctx.fillRect(Math.round(sx-u*2),by_+bh-u,u*4,u*2);ctx.fillRect(Math.round(sx-u),by_+bh+u,u*2,u*2);ctx.fillStyle=P.cream;ctx.fillRect(Math.round(sx-u),by_+bh-u,u*2,u*2);ctx.fillRect(Math.round(sx-u),by_+bh-u*2,u*2,u)}
    ctx.fillStyle=b.kind==='think'?'#6b4a3a':'#3b2417';ctx.textBaseline='middle';ctx.fillText(b.text,bx+padX,by_+bh/2+dpr*0.5);
  }
  function render(){
    const s=scale();const cw=canvas.width,ch=canvas.height;
    const ox=Math.round(cw/2-cam.x*s),oy=Math.round(ch/2-cam.y*s);
    ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#1f4527';ctx.fillRect(0,0,cw,ch);
    ctx.setTransform(s,0,0,s,ox,oy);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(ground,0,0);
    // water life
    for(const sp of sparkles){const v=Math.sin(T*sp.sp+sp.ph);if(v>0.55){ctx.fillStyle=v>0.85?'#e6f8ff':'#a8dcf2';ctx.fillRect(sp.x,sp.y,v>0.85?3:2,1)}}
    for(const rp of ripples){const rr=Math.round(rp.t*6);ctx.fillStyle=`rgba(200,236,250,${0.8-rp.t*0.5})`;ctx.fillRect(rp.x-rr,rp.y,1,1);ctx.fillRect(rp.x+rr,rp.y,1,1);ctx.fillRect(rp.x-Math.round(rr*.7),rp.y-Math.round(rr*.4),Math.round(rr*1.4)+1,1);ctx.fillRect(rp.x-Math.round(rr*.7),rp.y+Math.round(rr*.4),Math.round(rr*1.4)+1,1)}
    for(const d of ducks){const x=Math.round(d.cx+Math.cos(d.a)*d.rx),y=Math.round(d.cy+Math.sin(d.a)*d.ry);const fx=-Math.sin(d.a)>0?1:-1;const bob=Math.floor(T*2+d.a)%2;
      if(!isWater(x,y))continue;ctx.fillStyle='rgba(200,236,250,.7)';ctx.fillRect(x-5*fx-(fx<0?1:0),y+1,3,1);ctx.fillRect(x-7*fx-(fx<0?1:0),y+2,2,1);
      const q=(dx,dy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(fx>0?x+dx:x-dx-w,y+dy-bob,w,h)};q(-4,-3,8,4,P.out);q(-3,-2,6,3,'#fbf6ea');q(-3,0,6,1,'#d8d0c0');q(1,-6,4,4,P.out);q(2,-5,2,3,'#2f7a4a');q(5,-4,2,1,'#f0a030');q(3,-5,1,1,'#111');q(-2,-2,3,1,'#e0d8c8')}
    // cloud shadows (on ground)
    ctx.globalAlpha=0.1;for(const c of clouds)ctx.drawImage(cloudCv,Math.round(c.x),Math.round(c.y),Math.round(140*c.s),Math.round(70*c.s));ctx.globalAlpha=1;
    // entities
    const list=staticEnts.slice();
    for(const a of agents)if(!a.hidden)list.push({y:a.y+0.5,kind:'a',a});
    for(const c of chickens)list.push({y:c.y,kind:'k',k:c});
    list.sort((p,q)=>p.y-q.y);
    // cull
    const vx0=cam.x-cw/2/s-60,vx1=cam.x+cw/2/s+60,vy0=cam.y-ch/2/s-20,vy1=cam.y+ch/2/s+110;
    for(const e of list){const ex=e.kind==='b'?e.b.x+50:e.kind==='t'?e.t.x:e.kind==='c'?e.c.x:e.kind==='a'?e.a.x:e.kind==='k'?e.k.x:e.x;if(ex<vx0-60||ex>vx1+60||e.y<vy0||e.y>vy1)continue;drawEnt(e)}
    // particles
    for(const p of smoke){const sz=Math.round(2+p.t*1.2*p.s);ctx.fillStyle=`rgba(230,228,220,${Math.max(0,0.7-p.t*0.17)})`;ctx.fillRect(Math.round(p.x),Math.round(p.y),sz,sz)}
    for(const l of leaves){ctx.fillStyle=l.col;ctx.fillRect(Math.round(l.x),Math.round(l.y),Math.floor(l.t*4)%2?2:1,1)}
    for(const b of butterflies){const x=Math.round(b.cx+Math.sin(T*0.6+b.a)*34+Math.sin(T*1.7+b.b)*8),y=Math.round(b.cy+Math.cos(T*0.5+b.b)*14+Math.sin(T*2.3)*3)-6;const fl=Math.floor(T*8+b.a)%2;
      ctx.fillStyle='rgba(18,32,14,.2)';ctx.fillRect(x,y+8,2,1);ctx.fillStyle=b.col;if(fl){ctx.fillRect(x-1,y,1,2);ctx.fillRect(x+2,y,1,2)}else{ctx.fillRect(x-1,y,1,1);ctx.fillRect(x+2,y,1,1);ctx.fillRect(x-2,y-1,1,1);ctx.fillRect(x+3,y-1,1,1)}ctx.fillStyle=P.out;ctx.fillRect(x,y,2,2)}
    if(birds){for(let i=0;i<4;i++){const bx=Math.round(birds.x-[0,9,9,18][i]),byy=Math.round(birds.y+[0,-5,5,-9][i]+Math.sin(birds.t*3+i)*1.5);const fl=Math.floor(birds.t*6+i)%2;
      ctx.fillStyle='rgba(18,32,14,.2)';ctx.fillRect(bx-10,byy+40,4,1);ctx.fillStyle='#3b2c2a';ctx.fillRect(bx,byy,2,1);if(fl){ctx.fillRect(bx-2,byy-1,2,1);ctx.fillRect(bx+2,byy-1,2,1)}else{ctx.fillRect(bx-2,byy+1,2,1);ctx.fillRect(bx+2,byy+1,2,1)}}}
    // labels
    if(opts.showLabels!==false)for(const a of agents)drawLabel(a);else if(selected)drawLabel(selected);
    // lighting
    const L=lightFor(opts.timeOfDay||'Morning');
    ctx.setTransform(1,0,0,1,0,0);
    if(L.mul){ctx.globalCompositeOperation='multiply';ctx.fillStyle=L.mul;ctx.fillRect(0,0,cw,ch)}
    if(L.add){ctx.globalCompositeOperation='source-over';ctx.fillStyle=L.add;ctx.fillRect(0,0,cw,ch)}
    ctx.globalCompositeOperation='lighter';ctx.setTransform(s,0,0,s,ox,oy);
    const ga=0.25+L.dark*0.75;ctx.globalAlpha=ga;
    for(const [b,pts,col,rad] of glows){const lab=b.key==='lab';if(!lab&&L.dark<0.3&&!b.inside.size)continue;const gs=glowSprite(col,rad);ctx.globalAlpha=lab?Math.max(0.35,ga)*(0.7+0.3*Math.sin(T*2.2)):ga;for(const [x,y] of pts)ctx.drawImage(gs,b.x+x-rad,b.y+y-rad)}
    if(L.dark>0.3){ctx.globalAlpha=L.dark*0.9;const gs=glowSprite('#ffc870',16);for(const [x,y] of lamps)ctx.drawImage(gs,x-16,y-16)}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    if(L.dark>0.6){for(let i=0;i<14;i++){const x=Math.round(300+Math.sin(T*0.4+i*1.7)*260+i*20),y=Math.round(330+Math.cos(T*0.33+i*2.1)*160);if(Math.sin(T*3+i)>0){ctx.fillStyle='#fff8a0';ctx.fillRect(x,y,1,1)}}}
    // screen-space: bubbles, building tooltip
    ctx.setTransform(1,0,0,1,0,0);
    for(const a of agents){if(!a.bubble||a.hidden)continue;const sx=(a.x)*s+ox,sy=(a.y-30)*s+oy;bubbleScreen(a,sx,sy,s)}
    if(hover&&hover.type==='b'&&!down){const b=hover.b;const who=[...b.inside].map(id=>AM[id].name);const near=agents.filter(a=>!a.hidden&&a.home===b.name&&a.mode==='work').map(a=>a.name);
      const line2=who.length?`${who.join(', ')} inside`:near.length?`${near.join(', ')} working nearby`:'Quiet right now';
      const fs=Math.round(12*dpr),fs2=Math.round(10*dpr);ctx.font=`${fs}px "Pixelify Sans", monospace`;const w1=ctx.measureText(b.name).width;ctx.font=`${fs2}px "Pixelify Sans", monospace`;const w2=ctx.measureText(line2).width;
      const u=Math.round(2*dpr),bw=Math.ceil(Math.max(w1,w2))+16*dpr,bh=fs+fs2+14*dpr;const bx=Math.round((b.x+b.w/2)*s+ox-bw/2),byy=Math.round((b.y+6)*s+oy-bh);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(bx+u,byy+u*2,bw,bh);ctx.fillStyle=P.w0;ctx.fillRect(bx+u,byy,bw-2*u,bh);ctx.fillRect(bx,byy+u,bw,bh-2*u);ctx.fillStyle=P.w2;ctx.fillRect(bx+u,byy+u,bw-2*u,bh-2*u);ctx.fillStyle=P.w3;ctx.fillRect(bx+u,byy+u,bw-2*u,u);
      ctx.textBaseline='top';ctx.fillStyle=P.cream;ctx.font=`${fs}px "Pixelify Sans", monospace`;ctx.fillText(b.name,bx+8*dpr,byy+5*dpr);ctx.fillStyle=P.d4;ctx.font=`${fs2}px "Pixelify Sans", monospace`;ctx.fillText(line2,bx+8*dpr,byy+fs+8*dpr)}
  }
  function drawPortrait(pc,a){const g=pc.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,pc.width,pc.height);
    g.fillStyle='#6cb651';g.fillRect(0,0,32,32);for(let y=0;y<32;y++)for(let x=0;x<32;x++){if(hash(x,y,99)>.9){g.fillStyle=P.g2;g.fillRect(x,y,1,1)}}g.fillStyle=P.g4;g.fillRect(5,26,1,1);g.fillRect(25,24,1,1);g.fillStyle='#55a046';g.fillRect(0,26,32,6);
    drawAgent(g,10,8,a,'down',0,a.mode==='sleep'?'sleep':a.mode==='work'&&a.pose==='work'?'work':'idle',a.t)}
  try{frameInner(performance.now())}catch(err){window.__farmErr=String(err.stack||err)}
  raf=requestAnimationFrame(frame);
  const snap=a=>{const statusText={walk:`Walking to ${({board:'the quest board',crt:'the workbench',visitBramble:'see Bramble',readbench:'the reading bench',visitJuniper:'see Juniper',vat:'the vat',visitClover:'see Clover',ship:'the shipping bin',nap:'the pond oak',hd:'the Farmhouse',wd:'the Workshop',ld:'the Library',ad:'the Lab',f1:'the fields',f2:'the fields',f3:'the fields',f4:'the fields'})[a.destName]||'…'}`,work:'Working',talk:'Chatting',inside:`Inside the ${B[a.inB]?B[a.inB].name.replace('Developer ','').replace('Research ','').replace('Testing ',''):''}`,sleep:'Resting',idle:'Idle'}[a.mode];
    return {id:a.id,name:a.name,role:a.role,home:a.home,mode:a.mode,statusText,task:a.task||(liveMode?'Waiting for Claude Code events':a.tasks[a.taskI]),progress:Math.round(a.progress),energy:Math.round(a.energy),logs:a.logs.slice(0,4)}};
  const miniCache={};
  return {
    agents:()=>agents.map(snap),get:id=>AM[id]?snap(AM[id]):null,
    syncAgents:state=>{for(const item of state){const a=AM[item.id];if(!a)continue;a.name=item.name;a.role='Codex';a.liveStatus=item.status;a.mode=item.status==='working'?'work':'idle';a.pose=item.status==='working'?'work':'sit';a.dir='down';a.task=item.error||item.prompt||'Aguardando sua tarefa';a.progress=0;a.logs=[];a.bubble=null;}cfg.onChange&&cfg.onChange();},
    receiveLive,setLiveMode:v=>{liveMode=!!v},
    clock:()=>fmt(clock.m),activeCount:()=>liveMode?agents.filter(a=>a.liveStatus==='working').length:agents.filter(a=>a.mode!=='sleep').length,total:agents.length,
    select,setFollow:v=>{follow=v&&!!selected},setMode:m=>{mode=m;canvas.style.cursor=m==='pan'?'grab':'default'},setPaused:v=>{paused=v},
    zoomIn:()=>zoomAt(1),zoomOut:()=>zoomAt(-1),home:()=>{follow=false;cam.x=470;cam.y=330;const z=Math.max(0.5,Math.min(2,Math.min(vw/W,vh/H)));cam.tz=z;cam.anchor=null},
    mini:id=>{if(miniCache[id])return miniCache[id];const [c,g]=mk(14,14);drawAgent(g,1,2,AM[id],'down',0,'idle',0.3);const [c2,g2]=mk(14,12);g2.drawImage(c,0,0);miniCache[id]=c2.toDataURL();return miniCache[id]},
    icon5:k=>icon5[k].toDataURL(),
    say:(id,text)=>{const a=AM[id];if(a&&!a.hidden){a.bubble={text,t:3,kind:'say'};log(a,'Got a note from you')}},
    step:(n=1,dt=0.05)=>{for(let i=0;i<n;i++){last=performance.now()-dt*1000;frameInner(performance.now())}},
    destroy:()=>{cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKey)}
  };
}

// ---------- UI icon maps (12x12) ----------
const UI_ICONS = {
  cursor:['a...........','aa..........','aba.........','abba........','abbba.......','abbbba......','abbbbba.....','abbbbbba....','abbbbaaaa...','abaabba.....','aa..abba....','.....aa.....'],
  pan:['.....a......','....aba.....','...abbba....','....aba.....','.a...b...a..','abbbbbbbbba.','.a...b...a..','....aba.....','...abbba....','....aba.....','.....a......','............'],
  agents:['..aaa...ccc.','.addda.ceeec','.addda.ceeec','..aaa...ccc.','............','.aaaaa.ccccc','abbbbbacfffc','abbbbbacfffc','abbbbbacfffc','aaaaaaaccccc','............','............'],
  zoomin:['..aaaa......','.abbbba.....','abbggbba....','abggggba....','abbggbba....','abbbbbba....','.abbbba.....','..aaaaaa....','......aaa...','.......aaa..','........aa..','............'],
  zoomout:['..aaaa......','.abbbba.....','abbbbbba....','abggggba....','abbbbbba....','abbbbbba....','.abbbba.....','..aaaaaa....','......aaa...','.......aaa..','........aa..','............'],
  home:['.....aa.....','....arra....','...arrrra...','..arrrrrra..','.arrrrrrrra.','aaaaaaaaaaaa','.awwwwwwwwa.','.awwbbwggwa.','.awwbbwggwa.','.awwbbwwwwa.','.awwbbwwwwa.','.aaaaaaaaaa.'],
  pause:['............','.aaaa..aaaa.','.abba..abba.','.abba..abba.','.abba..abba.','.abba..abba.','.abba..abba.','.abba..abba.','.abba..abba.','.abba..abba.','.aaaa..aaaa.','............'],
  play:['............','.aa.........','.abaa.......','.abbbaa.....','.abbbbbaa...','.abbbbbbba..','.abbbbbbba..','.abbbbbaa...','.abbbaa.....','.abaa.......','.aa.........','............'],
  sprout:['..aa....aa..','.agga..agga.','.agggaagggа.','..agggggga..','....aaga....','.....aga....','.....aga....','..aaaaaaaa..','..arrrrrra..','...arrrra...','...arrrra...','....aaaa....'],
  sun:['.....a......','..a..a..a...','...aaaaa....','..ayyyyya...','aayyyyyyyaa.','..ayyyyya...','..ayyyyya...','...aaaaa....','..a..a..a...','.....a......','............','............'],
  follow:['....aaaa....','...abbbba...','..abbaabba..','.abba..abba.','abba....abba','abba.aa.abba','abba.aa.abba','abba....abba','.abba..abba.','..abbaabba..','...abbbba...','....aaaa....'],
  chat:['............','.aaaaaaaaaa.','abbbbbbbbbba','abccbccbccba','abbbbbbbbbba','abbbbbbbbbba','.aaaaabbaaa.','.....abba...','......aba...','.......aa...','............','............'],
};
export function makeUIIcons(){
  const pal={a:'#2a1d1a',b:'#f3e2b8',c:'#e8c36a',d:'#f1c6a0',e:'#c98d5e',f:'#d0632c',g:'#4b94cf',r:'#d0632c',w:'#a46b3b',y:'#ffd36b'};
  const pal2=Object.assign({},pal,{b:'#4c7a3a'});
  const out={};
  for(const k in UI_ICONS){const rows=UI_ICONS[k].map(r=>r.replace(/[^a-z.]/g,'a'));const p=k==='agents'?Object.assign({},pal,{b:'#4c7a3a',f:'#d0632c'}):k==='sprout'?Object.assign({},pal,{g:'#6cb651'}):k==='follow'?Object.assign({},pal,{b:'#ffd36b'}):pal;
    const [c,g]=mk(12,12);pmap(g,0,0,rows,p);out[k]=c.toDataURL()}
  return out;
}
