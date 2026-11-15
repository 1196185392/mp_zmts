const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'../miniprogram/pages/index/index.wxml');
const html=fs.readFileSync(file,'utf8');
if(!html.includes('<view class="app {{theme.dark?\'night\':\'\'}}" style="{{themeStyle}}">'))throw Error('app theme class is missing');
for(const name of ['nav-back','nav-home','nav-garden','nav-book','nav-me']){
  const themed=`src="{{theme.dark?'/assets/${name}-light.svg':'/assets/${name}.svg'}}"`;
  if(!html.includes(themed))throw Error('missing themed icon '+name);
  for(const suffix of ['.svg','-light.svg'])if(!fs.existsSync(path.join(__dirname,'../miniprogram/assets',name+suffix)))throw Error('missing asset '+name+suffix);
}
console.log('PASS theme-aware navigation icon references and assets');
