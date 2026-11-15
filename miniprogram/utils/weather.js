// Presentation-only weather state. Real weather must arrive through a trusted
// server endpoint so provider credentials never live in the mini program.
const options=[
  {id:'sunny',label:'晴朗',glyph:'☼',text:'晴朗'},
  {id:'cloudy',label:'多云',glyph:'☁',text:'晴间多云'},
  {id:'rain',label:'小雨',glyph:'☂',text:'小雨'},
  {id:'snow',label:'小雪',glyph:'✳',text:'小雪'}
];
const fallback={kind:'cloudy',text:'等待天气连接',temp:'--',updated:'等待地点授权',source:'',sourceLabel:''};
function normalize(value){
  const item=options.find(option=>option.id===value?.kind);
  return item?{...fallback,...value,kind:item.id,text:value.text||item.text}:fallback;
}
function fetchCurrent(location){
  const client=require('../services/client');
  if(!location||typeof location.latitude!=='number'||typeof location.longitude!=='number')return Promise.reject(new Error('LOCATION_NOT_PRECISE'));
  return client.request('/v1/context/weather',{data:{lat:location.latitude,lon:location.longitude},timeout:7000,authenticated:false}).then(normalize);
}
module.exports={options,fallback,normalize,fetchCurrent};
