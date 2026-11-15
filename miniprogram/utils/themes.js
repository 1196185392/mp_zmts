const tones=[{name:'麦穗金',value:'#805D31'},{name:'松野绿',value:'#3F614C'},{name:'雾山蓝',value:'#47677F'},{name:'陶土红',value:'#965E4B'},{name:'莓果紫',value:'#795C78'},{name:'暖石灰',value:'#59615F'},{name:'落日橙',value:'#9F6033'},{name:'夜田青',value:'#466F72'}];
const backgrounds=[{name:'麦纸',value:'#F8F5EB'},{name:'晨雾',value:'#F0F4F5'},{name:'草木',value:'#F0F4EC'},{name:'花笺',value:'#F7F0F3'},{name:'陶白',value:'#F8F0E9'},{name:'夜色',value:'#1F2927'}];
const accents=[{name:'麦田',value:'#E4C56D'},{name:'嫩芽',value:'#B7CD97'},{name:'湖水',value:'#B2CDDB'},{name:'杏子',value:'#E9B590'},{name:'花瓣',value:'#D7B6CA'},{name:'月白',value:'#DFDFD1'},{name:'淡藤',value:'#BEB8DB'},{name:'青瓷',value:'#A4C9B8'}];
const presets=[
 {id:'wheat',name:'麦田来信',desc:'麦纸 × 麦穗金 × 暖黄',primary:'#805D31',background:'#F8F5EB',accent:'#E4C56D'},
 {id:'forest',name:'松野微风',desc:'草木 × 松野绿 × 嫩芽',primary:'#3F614C',background:'#F0F4EC',accent:'#B7CD97'},
 {id:'mist',name:'雾蓝清晨',desc:'晨雾 × 雾山蓝 × 湖水',primary:'#47677F',background:'#F0F4F5',accent:'#B2CDDB'},
 {id:'clay',name:'陶土日落',desc:'陶白 × 陶土红 × 杏子',primary:'#965E4B',background:'#F8F0E9',accent:'#E9B590'},
 {id:'berry',name:'莓果花笺',desc:'花笺 × 莓果紫 × 花瓣',primary:'#795C78',background:'#F7F0F3',accent:'#D7B6CA'},
 {id:'night',name:'月下田园',desc:'夜色 × 嫩芽 × 月白',primary:'#B7CD97',background:'#1F2927',accent:'#DFDFD1'}
];
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function luminance(hex){const c=rgb(hex).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function foreground(bg){return contrast(bg,'#FFFFFF')>contrast(bg,'#17251F')?'#FFFFFF':'#17251F';}
function mix(a,b,t){return '#'+rgb(a).map((v,i)=>Math.round(v*(1-t)+rgb(b)[i]*t).toString(16).padStart(2,'0')).join('');}
function derive(input){const p=presets.find(p=>p.id===input?.id);const clean=v=>/^#[0-9a-f]{6}$/i.test(v||'');const x={...(p||presets[0]),...input};if(!clean(x.primary)||!clean(x.background)||!clean(x.accent))return derive(presets[0]);const dark=luminance(x.background)<.16;const text=dark?'#F0F1E8':'#29392F';let primary=x.primary;if(contrast(primary,x.background)<3)primary=mix(primary,dark?'#FFFFFF':'#17251F',.48);const surface=dark?'#2B3732':'#FFFFFF';return {...x,primary,dark,surface,text,muted:dark?'#D1DCCC':'#68735F',border:dark?'#526258':'#E6E8DD',primarySoft:mix(surface,primary,.10),onPrimary:foreground(primary),onAccent:foreground(x.accent),hero:mix(x.background,x.accent,.30),textOnHero:text};}
function css(theme){const t=derive(theme);return `--primary:${t.primary};--on-primary:${t.onPrimary};--accent:${t.accent};--on-accent:${t.onAccent};--bg:${t.background};--surface:${t.surface};--ink:${t.text};--muted:${t.muted};--border:${t.border};--soft:${t.primarySoft};--hero:${t.hero};background:${t.background};color:${t.text};`;}
function shuffle(){const pick=a=>a[Math.floor(Math.random()*a.length)];const p=pick(tones),b=pick(backgrounds),a=pick(accents);return derive({id:'custom',name:'我的灵感配色',primary:p.value,background:b.value,accent:a.value});}
module.exports={tones,backgrounds,accents,presets,derive,css,shuffle,contrast};
