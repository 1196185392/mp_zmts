// Authored visual chapters, not an agronomic prediction or a generative AI output.
const species=[
 {id:'tomato',name:'小番茄',image:'/assets/tomato.svg',kind:'fruit',chapters:[
  {short:'种子',copy:'播种后，种子在合适的条件下开始萌发。',care:'萌发受温度和水分影响。'},
  {short:'萌芽',copy:'根向下生长，幼芽逐渐露出土面。',care:'看出芽情况和盆土湿度。'},
  {short:'幼苗',copy:'幼苗展开真叶，茎和叶逐渐长大。',care:'看新叶的颜色和茎的长势。'},
  {short:'开花',copy:'叶片之间长出花序，小花陆续开放。',care:'留意花朵是否开放，以及周围的通风情况。'},
  {short:'结果',copy:'部分花朵授粉后发育成果实，果实成熟时逐渐变色。',care:'看果实的大小和颜色变化。'}]},
 {id:'lettuce',name:'生菜',image:'/assets/lettuce.svg',kind:'leafy',chapters:[
  {short:'种子',copy:'生菜从种子开始，先长出根。',care:'萌发受温度和水分影响。'},
  {short:'萌芽',copy:'两片子叶展开，露出土面。',care:'看子叶是否展开、出苗是否均匀。'},
  {short:'真叶',copy:'子叶之间长出第一批真叶。',care:'对比子叶和真叶的形状。'},
  {short:'长叶',copy:'叶片逐渐增多、长大。',care:'观察叶片大小、颜色和长势。'},
  {short:'采收',copy:'生菜通常在叶片长到合适大小时采收。',care:'按品种和叶片状态判断采收时机。'}]},
 {id:'flower',name:'长寿花',image:'/assets/flower.svg',kind:'flower',chapters:[
  {short:'开始',copy:'这里演示从一段长寿花插穗开始。',care:'观察插穗的茎和叶片。'},
  {short:'扎根',copy:'插穗底部逐渐长根。',care:'观察叶片是否挺立，有无萎蔫。'},
  {short:'长叶',copy:'植株继续长出新叶。',care:'留意新叶的颜色和排列。'},
  {short:'花苞',copy:'枝头逐渐出现花苞。',care:'留意花苞的大小和颜色。'},
  {short:'花开',copy:'花苞陆续开放，形成成簇的小花。',care:'观察同一簇花里先后开放的小花。'}]}
];
function get(id){return species.find(s=>s.id===id)||species[0];}
function frame(id,index){const s=get(id),i=Math.max(0,Math.min(4,Math.round(Number(index)||0)));return {...s,index:i,chapter:s.chapters[i],progress:i*25,leaves:i===0?[]:Array.from({length:i===1?2:i===2?6:i===3?10:12},(_,k)=>({id:k,side:k%2?'right':'left',bottom:34+Math.floor(k/2)*25,size:i===1?34:45+(k%3)*7,delay:k*.06})),flowers:i>=3&&s.kind!=='leafy'?[{x:30,y:20},{x:53,y:6},{x:71,y:30}]:[],fruits:i===4&&s.kind==='fruit'?[{x:30,y:34},{x:60,y:17},{x:74,y:46}]:[]};}
function story(db,speciesId){
  const species=get(speciesId);
  const plants=db.plants.filter(plant=>plant.plantId===species.id);
  const plantIds=new Set(plants.map(plant=>plant.id));
  const notes=db.notes.filter(note=>plantIds.has(note.gardenId)).sort((a,b)=>b.created-a.created);
  return {
    hasPlant:plants.length>0,
    title:plants.length>1?species.name+' · '+plants.length+' 株':plants[0]?.name||'',
    quote:(notes[0]?.content||'').slice(0,90),
    photoCount:notes.reduce((count,note)=>count+(note.photos||[]).length,0),
    recordCount:notes.length,
    plantId:species.id
  };
}
module.exports={species,get,frame,story};
