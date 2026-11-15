const {bundledPlants:plants}=require('../../services/catalog');
const Themes=require('../../utils/themes');
const Growth=require('../../utils/growth');
const Auth=require('../../utils/auth');
const retiredViews=new Set(['calendar','location','weather','community']);
const terms=require('../../utils/gardening-glossary');
const Client=require('../../services/client');
const PhotoCorrections=require('../../services/photo-corrections');
const CatalogPhotos=require('../../services/catalog-photos');
const WeatherEffects=require('../../utils/weather-effects');
const Location=require('../../utils/planting-location');
const RegionPicker=require('../../utils/region-picker');
const KEY='yifangtiandi-native-v1';
const ROOTS=['home','garden','learn','profile'];
const environments=['阳台','露台','温室','庭院/菜园'];
const defaultEnvironment='露台';
const actions=['浇水','施肥','采收','间苗','修剪','搭架','除草','打药'];
const today=()=>{const d=new Date(Date.now()+8*3600000);return d.toISOString().slice(0,10);};
const makeId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const defaults=()=>({plants:[],notes:[],completed:[],environment:defaultEnvironment,light:'全日照',season:'霜降',theme:Themes.presets[0],guideSeen:false});
function restoreGardenEnvironments(db){
  if(!environments.includes(db.environment))db.environment=defaultEnvironment;
  db.plants=db.plants.map(plant=>environments.includes(plant.environment)
    ? plant
    : {...plant,environment:db.environment});
}
const age=g=>Math.max(1,Math.floor((new Date(today()+'T12:00:00+08:00')-new Date(g.date+'T12:00:00+08:00'))/86400000)+1);
module.exports={
 data:{growthSpecies:Growth.species,growth:Growth.frame('tomato',0),growthIndex:0,growthPlaying:false,motionOn:true,story:Growth.story({plants:[],notes:[]},'tomato'),brand:'朝暮田事',view:'home',title:'朝暮田事',plantingCityName:'',plantingRegion:[],plantingLocationHint:'',locatingPlantingRegion:false,failedPlantPhotos:{},failedOverridePhotos:{},photoOverrides:{},statusTop:24,navHeight:44,isRoot:true,scrollTop:0,theme:Themes.derive(Themes.presets[0]),themeStyle:Themes.css(Themes.presets[0]),themeDraft:Themes.presets[0],presets:Themes.presets,tones:Themes.tones,backgrounds:Themes.backgrounds,accents:Themes.accents,categories:['全部','蔬菜','水果','花卉','香草','树木'],category:'全部',query:'',gardenEnvironment:'',gardenTab:'全部',gardenTabs:['全部','在种','已结束'],actions,recordActions:['浇水','施肥','补苗','修剪','除草','松土','覆盖','遮阳','防寒','杀虫','采收'],methods:['直接播种','育苗移栽','移栽'],sources:['购买种子','自留种','购买苗','扦插','分株','赠送'],positions:['花盆','地栽','菜床','种植箱','水培'],environments,lights:['全日照','半日照','偏阴'],seasons:['立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','立冬','小雪','大雪','冬至','小寒','大寒'],sheet:'',form:{},record:{actions:[],photos:[],content:'',date:today(),gardenId:''},formError:'',noteQuery:'',today:today(),dateText:'',garden:[],notes:[],selectedPlant:plants[0],selectedGarden:null,plantOptions:['种植随记'],recordPlantIndex:0,previewName:'给生活种下一点期待',term:null,terms},
 onLoad(options){options=options||{};this.history=[];this.catalogPlants=plants;const pages=typeof getCurrentPages==='function'?getCurrentPages():[];this.isInnerPage=Boolean(pages.length&&/^pages\/inner\/(index|night)$/.test(pages[pages.length-1].route));let stored;try{stored=wx.getStorageSync(KEY);}catch(e){}this.db=Object.assign(defaults(),stored||{});if(!Array.isArray(this.db.plants)||!Array.isArray(this.db.notes))this.db=defaults();
   restoreGardenEnvironments(this.db);
   let environment=options.environment||'';
   try{environment=decodeURIComponent(environment);}catch(e){}
   this.addEnvironment=environments.includes(environment)?environment:'';
   this.db.theme=Themes.derive(this.db.theme);this.currentPlant=options.plant||this.currentPlant;this.currentGarden=options.garden||this.currentGarden;let info={statusBarHeight:24};try{info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();}catch(e){}let cap;try{cap=wx.getMenuButtonBoundingClientRect();}catch(e){}const top=info.statusBarHeight||24;const target=this.isInnerPage&&options.view?(retiredViews.has(options.view)?'catalog':options.view):'home';const titles={home:'朝暮田事',garden:'我的田地',learn:'种植书房',profile:'我的',about:'关于',catalog:'植物图鉴',plant:'植物图鉴',add:'添加种植',detail:'植物档案',record:'记录生长',notes:'田间日记',reminders:'今日待办',theme:'我的配色',growth:'生长剧场',calendar:'播种日历',term:'种植小词典',location:'种植地点',weather:'田地天气',auth:'反馈管理登录',community:'田边交流',feedback:'意见反馈',feedbackAdmin:'反馈收件箱',photoCorrections:'照片纠错'};let termName=options.term||'';try{termName=decodeURIComponent(termName);}catch(e){}const term=target==='term'?terms.find(item=>item.id===termName||item.name===termName)||null:null;if(target==='theme'){this.savedTheme={...this.db.theme};this.setData({themeDraft:{...this.savedTheme}});}this.setData({plantingLocationEnabled:Location.enabled,term,feedback:{category:'suggestion',content:'',contact:''},feedbackSending:false,feedbackDone:false,feedbackItems:[],feedbackFilter:'open',isAdmin:false,theme:this.db.theme,themeStyle:Themes.css(this.db.theme),view:target,title:titles[target]||'朝暮田事',isRoot:ROOTS.indexOf(target)>=0,statusTop:top,navHeight:cap&&cap.height?Math.max(44,(cap.top-top)*2+cap.height):44,today:today(),dateText:today().slice(5).replace('-',' / ')});if(target==='record'){const gardenId=options.garden||'';this.setData({record:{gardenId,content:'',photos:[],actions:options.action?[options.action]:[],date:today()},recordPlantIndex:gardenId?this.db.plants.findIndex(g=>g.id===gardenId)+1:0});}this.refresh();if(options&&options.screen==='growth')this.openGrowth();if(options&&options.screen==='theme')this.openTheme();if(options&&options.preset){const preset=Themes.presets.find(t=>t.id===options.preset);if(preset){this.setData({themeDraft:{...preset}});this.refresh();}}},
 onReady(){const seasons=this.data.seasons.slice();if(seasons.indexOf('霜降')<0)seasons.splice(seasons.indexOf('立冬'),0,'霜降');const terms=this.data.terms.map(item=>item.name==='授粉'?{...item,body:'花粉传到雌蕊柱头的过程。部分结果植物在室内种植时，需要关注授粉条件。',tip:'了解植物是否需要异花授粉或人工辅助，观察开花时间与环境变化。'}:item);this.setData({seasons,terms});if(!this.isInnerPage&&!this.db.guideSeen)this.setData({showGuide:true,guideStep:0});},
 onShow(){
   if(!this.db)return;
   let stored;
   try{stored=wx.getStorageSync(KEY);}catch(e){}
   if(stored&&Array.isArray(stored.plants)&&Array.isArray(stored.notes)){
     this.db=Object.assign(defaults(),stored);
     restoreGardenEnvironments(this.db);
     this.db.theme=Themes.derive(this.db.theme);
   }
   const next=this.db.nextRootView;
   if(!this.isInnerPage&&ROOTS.includes(next)){
     const environment=this.db.nextGardenEnvironment;
     delete this.db.nextRootView;
     delete this.db.nextGardenEnvironment;
     this.save();
     this.setData({view:next,title:({home:'朝暮田事',garden:'我的田地',learn:'种植书房',profile:'我的'})[next],isRoot:true,scrollTop:0});
     if(next==='garden'&&environments.includes(environment)){
       this.setData({gardenEnvironment:environment,gardenTab:'全部'});
     }
   }
   this.refresh();
   this.updateWeatherEffect();
   this.initializePlantingLocation();
   this.loadAccount();
   this.updateCatalogPhotoOverrides();
 },
 toast(title){
   clearTimeout(this.toastTimer);
   this.setData({toastText:title});
   this.toastTimer=setTimeout(()=>this.setData({toastText:''}),2200);
 },
 feedback(){try{wx.vibrateShort({type:'light'});}catch(e){}},
 save(){try{wx.setStorageSync(KEY,this.db);return true;}catch(e){this.toast('本机存储不足，请减少照片');return false;}},
 refresh(){const db=this.db;const catalog=this.catalogPlants||plants;const p=catalog.find(p=>p.id===this.currentPlant)||catalog[0]||plants[0];const annotate=g=>{const model=catalog.find(p=>p.id===g.plantId)||plants.find(p=>p.id===g.plantId);const estimatedDays=Number(model?.days);const hasCultivation=Boolean(model?.hasCultivation);return {...g,image:model?.image||'',age:age(g),hasCultivation,progress:hasCultivation&&Number.isFinite(estimatedDays)&&estimatedDays>0?Math.min(100,Math.round(age(g)/estimatedDays*100)):0,records:db.notes.filter(n=>n.gardenId===g.id).length};};const allGarden=db.plants.map(annotate);const selected=allGarden.find(g=>g.id===this.currentGarden)||null;const noteItems=db.notes.map(n=>({...n,plantName:(db.plants.find(g=>g.id===n.gardenId)||{}).name||'种植随记',day:n.date.slice(5).replace('-',' / ')})).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created);
 const featuredIds=['tomato','lettuce','strawberry'];
 const recommended=featuredIds.map(id=>catalog.find(plant=>plant.id===id)).filter(Boolean);
 const cat=this.data.category,q=this.data.query.trim().toLowerCase();const filtered=catalog.filter(p=>(cat==='推荐'||cat==='全部'||p.category===cat)&&(!q||(p.name+p.en+p.alias).toLowerCase().indexOf(q)>=0));const theme=this.data.view==='theme'?Themes.derive(this.data.themeDraft):Themes.derive(db.theme);
 const day=today();
 const todos=allGarden.filter(plant=>!plant.ended).map(plant=>{
   const id=plant.id+'-'+day;
   return {
     id,
     gardenId:plant.id,
     name:plant.name,
     place:[plant.environment,plant.position].filter(Boolean).join(' · '),
     done:db.completed.includes(id),
   };
 });
 const pendingTodos=todos.filter(task=>!task.done);
 const completedTodos=todos.filter(task=>task.done);
 const todoGroups=[
   {label:'待观察',items:pendingTodos},
   {label:'已完成',items:completedTodos},
 ];
 const todoProgress=todos.length?Math.round(completedTodos.length/todos.length*100):0;
 const {gardenEnvironment,gardenTab}=this.data;
 const environmentPlants=gardenEnvironment?allGarden.filter(plant=>plant.environment===gardenEnvironment):allGarden;
 const garden=gardenTab==='全部'?environmentPlants:environmentPlants.filter(plant=>gardenTab==='已结束'?plant.ended:!plant.ended);
 const inProgress=environmentPlants.filter(plant=>!plant.ended).length;
 const nquery=this.data.noteQuery.trim();this.setData({story:Growth.story(db,this.data.growth.id),environment:db.environment,light:db.light,season:db.season,theme,themeStyle:Themes.css(theme),recommended:recommended.slice(0,3),filteredPlants:filtered,allPlants:catalog,garden,allGarden,inProgress,gardenEndedCount:environmentPlants.length-inProgress,endedCount:allGarden.length-todos.length,selectedPlant:p,selectedGarden:selected,notes:noteItems.filter(n=>!nquery||(n.content+n.plantName+n.actions.join('')).indexOf(nquery)>=0),gardenNotes:noteItems.filter(n=>selected&&n.gardenId===selected.id),noteCount:db.notes.length,plantCount:db.plants.length,todos,todoGroups,todoProgress,todoCompletedCount:completedTodos.length,pending:pendingTodos.length,today:day,dateText:day.slice(5).replace('-',' / '),plantOptions:['种植随记'].concat(db.plants.map(g=>g.name)),themeName:theme.name});this.syncStatus(theme);},
 syncStatus(t){try{wx.setNavigationBarColor({frontColor:t.dark?'#ffffff':'#000000',backgroundColor:t.background,animation:{duration:0}});}catch(e){}},
 go(e){const view=typeof e==='string'?e:e.currentTarget.dataset.view;this.navigate(view);const titles={location:'种植地点',weather:'田地天气',auth:'反馈管理登录',community:'田边交流',feedback:'意见反馈',feedbackAdmin:'反馈收件箱',photoCorrections:'照片纠错'};if(titles[view]&&this.isInnerPage)this.setData({title:titles[view]});if(view==='feedbackAdmin'&&this.isInnerPage)this.loadFeedbackAdmin();},
 openInner(view,data={}){
   const pairs=['view='+encodeURIComponent(view)];
   Object.keys(data).forEach(key=>{if(data[key])pairs.push(encodeURIComponent(key)+'='+encodeURIComponent(data[key]));});
   const route=this.data.theme.dark?'night':'index';
   wx.navigateTo({url:'/pages/inner/'+route+'?'+pairs.join('&')});
 },
 navigate(view){if(retiredViews.has(view))view='catalog';if(view!=='growth')this.stopGrowth();if(!this.isInnerPage&&!ROOTS.includes(view)){this.openInner(view);return;}if(this.isInnerPage&&ROOTS.includes(view)){wx.navigateBack({delta:1});return;}if(this.data.view==='theme')this.db.theme=this.savedTheme||this.db.theme;if(this.data.view!==view)this.history.push(this.data.view);this.setData({view,title:({home:'朝暮田事',garden:'我的田地',learn:'种植书房',profile:'我的',about:'关于',catalog:'植物图鉴',plant:'植物图鉴',add:'添加种植',detail:'植物档案',record:'记录生长',notes:'田间日记',reminders:'今日待办',theme:'我的配色',growth:'生长剧场',calendar:'播种日历',term:'种植小词典',feedback:'意见反馈',feedbackAdmin:'反馈收件箱',photoCorrections:'照片纠错'})[view]||'朝暮田事',isRoot:ROOTS.indexOf(view)>=0,sheet:'',scrollTop:this.data.scrollTop===0?1:0,formError:''});this.refresh();this.updateCatalogPhotoOverrides();},
 switchTab(e){this.feedback();this.history=[];this.navigate(e.currentTarget.dataset.view);this.updateWeatherEffect();this.initializePlantingLocation();},
 back(){if(this.data.sheet){this.closeSheet();return;}if(this.data.view==='record'&&(this.data.record.content||this.data.record.photos.length||this.data.record.actions.length)){this.setData({sheet:'discardRecord'});return;}if(this.data.view==='add'&&this.formChanged()){this.setData({sheet:'discardPlant'});return;}this.doBack();},
 confirmDiscard(){this.closeSheet();this.doBack();},
 doBack(){this.stopGrowth();if(this.data.view==='record'){this.releasePhotos(this.data.record.photos);this.setData({record:{actions:[],photos:[],content:'',date:today(),gardenId:''}});}if(this.data.view==='theme'){this.db.theme=this.savedTheme||this.db.theme;this.setData({themeDraft:{...this.db.theme}});}if(this.isInnerPage){this.refresh();wx.navigateBack({delta:1});return;}const view=this.history.pop()||'home';this.setData({view,title:({home:'朝暮田事',garden:'我的田地',learn:'种植书房',profile:'我的',about:'关于',catalog:'植物图鉴',plant:'植物图鉴',detail:'植物档案',notes:'田间日记',growth:'生长剧场'})[view]||'朝暮田事',isRoot:ROOTS.indexOf(view)>=0,sheet:'',scrollTop:0});this.refresh();},
 openPlant(e){const plant=e.currentTarget.dataset.id;if(!this.isInnerPage){this.openInner('plant',{plant});return;}this.currentPlant=plant;this.navigate('plant');},
 openGardenCatalog(){
   const environment=this.data.gardenEnvironment;
   this.openInner('catalog',{environment});
 },
 addPlant(){
   const environment=this.addEnvironment||this.db.environment;
   this.initialPlantEnvironment=environment;
   this.setData({form:{name:this.data.selectedPlant.name,quantity:'',method:'直接播种',source:'购买种子',environment,position:'花盆',date:today()}});
   this.navigate('add');
 },
 formChanged(){const f=this.data.form;return f.name!==this.data.selectedPlant.name||f.quantity||f.method!=='直接播种'||f.source!=='购买种子'||f.environment!==this.initialPlantEnvironment||f.position!=='花盆'||f.date!==today();},
 formInput(e){this.setData({['form.'+e.currentTarget.dataset.field]:e.detail.value,formError:''});},
 pickForm(e){const {field,value}=e.currentTarget.dataset;const update={['form.'+field]:value};if(field==='method'&&value!=='移栽'&&['购买苗','扦插','分株'].indexOf(this.data.form.source)>=0)update['form.source']='购买种子';this.setData(update);},
 savePlant(){
   const form=this.data.form;
   if(!form.name.trim()){this.setData({formError:'给这株植物起个名字吧。'});return;}
   if(!environments.includes(form.environment)){this.setData({formError:'请选择种植环境。'});return;}
   if(!form.date||form.date>today()){this.setData({formError:'请选择今天或更早的种植日期。'});return;}
   const plant={...form,name:form.name.trim(),quantity:form.quantity.trim(),id:makeId(),plantId:this.currentPlant,ended:false};
   const previous=this.db;
   this.db={...previous,plants:[plant].concat(previous.plants)};
   if(this.isInnerPage){
     this.db.nextRootView='garden';
     this.db.nextGardenEnvironment=plant.environment;
   }
   if(!this.save()){this.db=previous;return;}
   this.history=[];
   this.setData({gardenEnvironment:plant.environment,gardenTab:'全部'});
   if(this.isInnerPage){
     this.setData({view:'garden',isRoot:true});
     wx.navigateBack({delta:1});
   }else this.navigate('garden');
   this.toast('种下了，等它慢慢长大');
 },
 searchPlant(e){this.setData({query:e.detail.value});this.refresh();},
 setCategory(e){this.setData({category:e.currentTarget.dataset.value});this.refresh();},
 searchNotes(e){this.setData({noteQuery:e.detail.value});this.refresh();},
 gardenTab(e){this.setData({gardenTab:e.currentTarget.dataset.value});this.refresh();},
 filterGardenEnvironment(e){
   const value=e.currentTarget.dataset.value||'';
   if(value&&!environments.includes(value))return;
   this.setData({gardenEnvironment:value});
   this.refresh();
 },
 openGardenEnvironment(){
   if(!this.data.selectedGarden)return;
   this.setData({sheet:'gardenEnvironment',gardenEnvironmentDraft:this.data.selectedGarden.environment});
 },
 chooseGardenEnvironment(e){
   const value=e.currentTarget.dataset.value;
   if(environments.includes(value))this.setData({gardenEnvironmentDraft:value});
 },
 saveGardenEnvironment(){
   const environment=this.data.gardenEnvironmentDraft;
   const id=this.currentGarden;
   if(this.data.sheet!=='gardenEnvironment'||!environments.includes(environment))return;
   const previous=this.db.plants;
   const plant=previous.find(item=>item.id===id);
   if(!plant)return;
   if(plant.environment!==environment){
     this.db.plants=previous.map(item=>item.id===id?{...item,environment}:item);
     if(!this.save()){this.db.plants=previous;return;}
     this.refresh();
     this.toast('种植环境已更新');
   }
   this.closeSheet();
 },
 openGarden(e){const garden=e.currentTarget.dataset.id;if(!this.isInnerPage){this.openInner('detail',{garden});return;}this.currentGarden=garden;const g=this.db.plants.find(g=>g.id===this.currentGarden);if(g)this.currentPlant=g.plantId;this.navigate('detail');},
 openQuick(){this.feedback();this.setData({sheet:'quick'});},
 closeSheet(){
   this.sheetConfirmation=null;
   if(this.data.sheet==='photoCorrection'){
     if(this.data.photoCorrectionSending)return;
     this.photoCorrectionDraft=null;
     this.setData({photoCorrectionPreview:'',photoCorrectionPreparing:false,photoCorrectionError:''});
   }
   this.clearCorrectionPreview();
   this.clearCatalogZoom();
   this.setData({sheet:'',photoPreview:[]});
 },
 async updateCatalogPhotoOverrides(){
   if(this.data.view!=='plant'&&this.data.view!=='catalog')return;
   const overrides=await CatalogPhotos.overrides();
   if((this.data.view!=='plant'&&this.data.view!=='catalog')||this.correctionPageUnloaded)return;
   const photoOverrides={};
   for(const [id,revision] of Object.entries(overrides)){
     photoOverrides[id]={revision,url:CatalogPhotos.photoUrl(id,revision)};
   }
   this.setData({photoOverrides});
 },
 hideFailedOverridePhoto(e){
   const {id}=e.currentTarget.dataset;
   this.setData({failedOverridePhotos:{...this.data.failedOverridePhotos,[id]:true}});
 },
 async openCatalogZoom(e){
   const id=e.currentTarget.dataset.id;
   const plant=(this.catalogPlants||plants).find(item=>item.id===id);
   const override=this.data.photoOverrides?.[id];
   if(!plant||(!plant.image&&!override))return;
   this.clearCatalogZoom();
   const request={};
   this.catalogZoomRequest=request;
   this.catalogZoomGestureAt=0;
   this.setData({
     sheet:'catalogZoom',catalogZoomTitle:plant.name,
     catalogZoomSource:override?.url||plant.image,catalogZoomFallback:plant.image,catalogZoomLoading:true,
   });
   try{
     const file=await CatalogPhotos.loadDetail(id,override?.revision);
     if(this.catalogZoomRequest!==request){
       CatalogPhotos.release(file);
       return;
     }
     if(file){
       this.catalogZoomFile=file;
       this.setData({catalogZoomSource:file});
     }
   }catch{/* The bundled image is available offline. */}
   finally{
     if(this.catalogZoomRequest===request)this.setData({catalogZoomLoading:false});
   }
 },
 restoreCatalogZoomFallback(){
   if(this.data.catalogZoomSource!==this.data.catalogZoomFallback){
     this.setData({catalogZoomSource:this.data.catalogZoomFallback});
   }
 },
 noteCatalogZoomGesture(){this.catalogZoomGestureAt=Date.now();},
 noteCatalogZoomMove(e){if(e.detail.source==='touch')this.noteCatalogZoomGesture();},
 tapCatalogZoom(){
   if(Date.now()-(this.catalogZoomGestureAt||0)>250)this.closeSheet();
 },
 clearCatalogZoom(){
   this.catalogZoomRequest=null;
   CatalogPhotos.release(this.catalogZoomFile);
   this.catalogZoomFile='';
 },
 openConfirmation(title,body,confirmAction,confirmLabel='确认',danger=false){
   this.sheetConfirmation=confirmAction||null;
   this.setData({sheet:'confirm',confirmation:{title,body,label:confirmLabel,danger,canCancel:Boolean(confirmAction)}});
 },
 confirmSheet(){
   if(this.data.sheet!=='confirm')return;
   const action=this.sheetConfirmation;
   this.closeSheet();
   if(action)action();
 },
 nextGuide(){const next=(this.data.guideStep||0)+1;if(next>=3){this.finishGuide();return;}this.setData({guideStep:next});},
 finishGuide(){this.db.guideSeen=true;this.save();this.setData({showGuide:false,guideStep:0});this.initializePlantingLocation();},
 replayGuide(){this.setData({showGuide:true,guideStep:0});},
 stop(){},
 openSettings(e){this.setData({sheet:e.currentTarget.dataset.sheet});},
 chooseSetting(e){const {field,value}=e.currentTarget.dataset;this.db[field]=value;if(this.save()){this.refresh();if(field==='season')this.closeSheet();}},
 beginLogin(){if(!Auth.isConfigured()){this.openConfirmation('登录暂不可用','请稍后再试。',null,'知道了');return;}Auth.signIn().then(result=>{this.setData({isAdmin:Boolean(result.user?.isAdmin)});this.toast('登录成功');}).catch(error=>{if(error.message==='AUTH_NOT_CONFIGURED'){this.openConfirmation('登录服务配置中','请稍后再试。',null,'知道了');return;}this.toast('登录暂时失败，请稍后重试');});},
 loadAccount(){if(!Client.accessToken()){this.setData({isAdmin:false});return;}Client.request('/v1/auth/me').then(result=>this.setData({isAdmin:Boolean(result.user?.isAdmin)})).catch(()=>this.setData({isAdmin:false}));},
 feedbackInput(e){this.setData({['feedback.'+e.currentTarget.dataset.field]:e.detail.value,formError:''});},
 resetFeedback(){this.setData({feedbackDone:false,feedback:{category:'suggestion',content:'',contact:''},formError:''});},
 chooseFeedbackCategory(e){this.feedback();this.setData({'feedback.category':e.currentTarget.dataset.category,formError:''});},
 submitFeedback(){if(this.data.feedbackSending)return;const f=this.data.feedback;const content=f.content.trim();if(content.length<8){this.setData({formError:'请再具体写一点，至少 8 个字，方便我们理解。'});return;}if(content.length>1000||f.contact.trim().length>100){this.setData({formError:'内容或联系方式太长了，请稍作精简。'});return;}this.setData({feedbackSending:true,formError:''});Client.request('/v1/feedback',{method:'POST',data:{category:f.category,content,contact:f.contact.trim()}}).then(()=>this.setData({feedbackDone:true,feedbackSending:false,feedback:{category:'suggestion',content:'',contact:''}})).catch(error=>this.setData({feedbackSending:false,formError:error.message==='FEEDBACK_RATE_LIMIT'?'今天提交得有点多，明天再来告诉我们吧。':'提交没有成功，请检查网络后重试。'}));},
 loadFeedbackAdmin(){if(!this.data.isAdmin)return;Client.request('/v1/admin/feedback?status='+this.data.feedbackFilter).then(result=>this.setData({feedbackItems:result.items||[],feedbackAdminError:''})).catch(()=>this.setData({feedbackAdminError:'暂时无法读取反馈，请稍后重试。'}));},
 filterFeedback(e){this.setData({feedbackFilter:e.currentTarget.dataset.status});this.loadFeedbackAdmin();},
 updateFeedbackStatus(e){const {id,status}=e.currentTarget.dataset;Client.request('/v1/admin/feedback/'+encodeURIComponent(id),{method:'PATCH',data:{status}}).then(()=>this.loadFeedbackAdmin()).catch(()=>this.toast('状态更新失败，请重试'));},
 openPhotoCorrection(){
   if(!this.data.selectedPlant)return;
   this.photoCorrectionDraft={plantId:this.data.selectedPlant.id,photo:''};
   this.setData({
     sheet:'photoCorrection',photoCorrectionPreview:'',photoCorrectionNote:'',
     photoCorrectionAuthorized:false,photoCorrectionError:'',photoCorrectionPreparing:false,
   });
 },
 chooseCorrectionPhoto(){
   const draft=this.photoCorrectionDraft;
   if(!draft||this.data.photoCorrectionPreparing||this.data.photoCorrectionSending)return;
   this.setData({photoCorrectionPreparing:true,photoCorrectionError:''});
   wx.chooseMedia({
     count:1,mediaType:['image'],sourceType:['album'],sizeType:['original','compressed'],
     success:async result=>{
       if(this.photoCorrectionDraft!==draft)return;
       try{
         const source=result.tempFiles?.[0]?.tempFilePath;
         if(!source)throw new Error('INVALID_IMAGE');
         const prepared=await PhotoCorrections.preparePhoto(this,source);
         if(this.photoCorrectionDraft!==draft)return;
         draft.photo=prepared.photo;
         this.setData({photoCorrectionPreview:prepared.preview});
       }catch{
         if(this.photoCorrectionDraft===draft)this.setData({photoCorrectionError:'无法处理这张图片，请换一张重试。'});
       }finally{
         if(this.photoCorrectionDraft===draft)this.setData({photoCorrectionPreparing:false});
       }
     },
     fail:error=>{
       if(this.photoCorrectionDraft!==draft)return;
       const message=String(error?.errMsg||'');
       this.setData({photoCorrectionPreparing:false,photoCorrectionError:message.includes('cancel')?'':'无法打开相册，请检查权限。'});
     },
   });
 },
 editCorrectionNote(e){this.setData({photoCorrectionNote:e.detail.value});},
 toggleCorrectionAuthorization(){this.setData({photoCorrectionAuthorized:!this.data.photoCorrectionAuthorized});},
 async submitPhotoCorrection(){
   const draft=this.photoCorrectionDraft;
   if(!draft||this.data.photoCorrectionSending||this.data.photoCorrectionPreparing)return;
   if(!draft.photo||!this.data.photoCorrectionAuthorized)return;
   this.setData({photoCorrectionSending:true,photoCorrectionError:''});
   try{
     await PhotoCorrections.submit(draft.plantId,draft.photo,this.data.photoCorrectionNote,true);
     if(this.photoCorrectionDraft!==draft)return;
     this.setData({photoCorrectionSending:false});
     this.closeSheet();
     this.toast('照片已提交，等待审核');
   }catch(error){
     if(this.photoCorrectionDraft!==draft)return;
     const message=error.statusCode===429?'今天提交的次数已用完，请明天再试。':'提交失败，照片还在，可以重试。';
     this.setData({photoCorrectionSending:false,photoCorrectionError:message});
   }
 },
 openPhotoCorrections(){
   this.navigate('photoCorrections');
   this.setData({correctionFilter:'pending'});
   this.loadPhotoCorrections();
 },
 filterPhotoCorrections(e){
   this.setData({correctionFilter:e.currentTarget.dataset.status});
   this.loadPhotoCorrections();
 },
 async loadPhotoCorrections(){
   const status=this.data.correctionFilter;
   const request={};
   this.correctionInboxRequest=request;
   this.setData({photoCorrectionItems:[],correctionInboxLoading:true,correctionInboxError:''});
   try{
     const result=await PhotoCorrections.list(status);
     if(this.correctionInboxRequest===request){
       this.setData({photoCorrectionItems:result.items||[],correctionInboxLoading:false});
     }
   }catch{
     if(this.correctionInboxRequest===request){
       this.setData({correctionInboxLoading:false,correctionInboxError:'暂时无法读取纠错记录。'});
     }
   }
 },
 async viewCorrectionPhoto(e){
   if(this.correctionPreviewLoading)return;
   this.correctionPreviewLoading=true;
   try{
     const file=await PhotoCorrections.saveReviewPreview(e.currentTarget.dataset.id);
     this.correctionPreviewFile=file;
     if(this.data.view!=='photoCorrections'||this.correctionPageUnloaded){
       this.clearCorrectionPreview();
       return;
     }
     this.setData({sheet:'photoPreview',photoPreview:[file],photoIndex:0});
   }catch{
     if(!this.correctionPageUnloaded)this.toast('照片暂时无法打开');
   }finally{
     this.correctionPreviewLoading=false;
   }
 },
 clearCorrectionPreview(){
   if(!this.correctionPreviewFile)return;
   wx.getFileSystemManager().unlink({filePath:this.correctionPreviewFile,fail(){}});
   this.correctionPreviewFile='';
 },
 async updatePhotoCorrection(e){
   if(this.data.correctionReviewing)return;
   const {id,status}=e.currentTarget.dataset;
   this.setData({correctionReviewing:true});
   try{
     await PhotoCorrections.review(id,status);
     if(this.data.view==='photoCorrections')await this.loadPhotoCorrections();
   }catch{
     this.toast('审核状态更新失败，请重试');
   }finally{
     this.setData({correctionReviewing:false});
   }
 },
 startRecord(e){const data=e&&e.currentTarget?e.currentTarget.dataset:{};const id=data.id||'';if(!this.isInnerPage){this.openInner('record',{garden:id,action:data.action||''});return;}this.setData({record:{gardenId:id,content:'',photos:[],actions:data.action?[data.action]:[],date:today()},recordPlantIndex:id?this.db.plants.findIndex(g=>g.id===id)+1:0});this.navigate('record');},
 chooseRecordPlant(e){const i=Number(e.detail.value);this.setData({recordPlantIndex:i,'record.gardenId':i?this.db.plants[i-1].id:''});},
 openRecordPlant(){this.feedback();this.setData({sheet:'recordPlant'});},
 selectRecordPlant(e){this.chooseRecordPlant({detail:{value:e.currentTarget.dataset.index}});this.closeSheet();},
 openDate(e){const target=e.currentTarget.dataset.target;const value=target==='form'?this.data.form.date:this.data.record.date;const parts=(value||today()).split('-').map(Number);const latest=Number(today().slice(0,4));this.feedback();this.setData({sheet:'date',dateTarget:target,dateYear:parts[0],dateMonth:parts[1],dateDay:parts[2],dateLimit:new Date(parts[0],parts[1],0).getDate(),dateYears:Array.from({length:latest-2019},(_,i)=>latest-i),dateMonths:Array.from({length:12},(_,i)=>i+1),dateDays:Array.from({length:31},(_,i)=>i+1),dateError:''});},
 chooseDatePart(e){const field=e.currentTarget.dataset.field;const value=Number(e.currentTarget.dataset.value);const update={['date'+field]:value,dateError:''};const year=field==='Year'?value:this.data.dateYear;const month=field==='Month'?value:this.data.dateMonth;const limit=new Date(year,month,0).getDate();const day=field==='Day'?value:this.data.dateDay;update.dateDay=Math.min(day,limit);update.dateLimit=limit;this.setData(update);},
 saveDate(){const pad=n=>String(n).padStart(2,'0');const value=this.data.dateYear+'-'+pad(this.data.dateMonth)+'-'+pad(this.data.dateDay);if(value>today()){this.setData({dateError:'日期不能晚于今天。'});return;}this.setData({[(this.data.dateTarget==='form'?'form':'record')+'.date']:value,formError:''});this.closeSheet();},
 recordInput(e){this.setData({['record.'+e.currentTarget.dataset.field]:e.detail.value,formError:''});},
 toggleAction(e){const a=e.currentTarget.dataset.value;let list=this.data.record.actions.slice();list=list.indexOf(a)>=0?list.filter(x=>x!==a):list.concat(a);this.setData({'record.actions':list,formError:''});},
 choosePhoto(){if(this.data.record.photos.length<3)this.setData({sheet:'photoSource'});},
 selectPhotoSource(e){
   const source=e.currentTarget.dataset.source;
   const count=3-this.data.record.photos.length;
   if(count<=0||!['album','camera'].includes(source))return;
   this.closeSheet();
   wx.chooseMedia({count,mediaType:['image'],sourceType:[source],sizeType:['compressed'],success:async result=>{
     const added=[];
     for(const file of result.tempFiles){
       try{
         const compressed=await new Promise((resolve,reject)=>wx.compressImage({src:file.tempFilePath,quality:65,success:resolve,fail:reject}));
         const saved=await new Promise((resolve,reject)=>wx.getFileSystemManager().saveFile({tempFilePath:compressed.tempFilePath,success:resolve,fail:reject}));
         added.push(saved.savedFilePath);
       }catch(err){this.toast('图片保存失败，请重试');}
     }
     if(this.data.view!=='record'){this.releasePhotos(added);return;}
     this.setData({'record.photos':this.data.record.photos.concat(added).slice(0,3),formError:''});
   },fail:error=>{if(!/cancel/i.test(error?.errMsg||''))this.toast('无法打开照片来源，请检查微信权限');}});
 },
 releasePhotos(photos){if(typeof wx.removeSavedFile==='function')photos.forEach(filePath=>wx.removeSavedFile({filePath,fail(){}}));},
 removePhoto(e){const i=Number(e.currentTarget.dataset.index);this.releasePhotos(this.data.record.photos.filter((_,index)=>index===i));this.setData({'record.photos':this.data.record.photos.filter((_,index)=>index!==i)});},
 previewPhoto(e){
   const {src,urls}=e.currentTarget.dataset;
   if(!Array.isArray(urls)||!urls.includes(src))return;
   this.setData({sheet:'photoPreview',photoPreview:urls,photoIndex:urls.indexOf(src)});
 },
 changePreviewPhoto(e){this.setData({photoIndex:e.detail.current});},
 saveRecord(){const r=this.data.record;if(!r.content.trim()){this.setData({formError:r.photos.length?'照片已经选好，再写一句当时的观察或心情吧。':'写一句今天的观察或心情，再保存这次生长。'});return;}if(!r.date||r.date>today()){this.setData({formError:'请选择有效的记录日期。'});return;}this.db.notes.unshift({...r,content:r.content.trim(),id:makeId(),created:Date.now()});if(!this.save()){this.db.notes.shift();return;}this.navigate('notes');this.history=[];this.setData({record:{gardenId:'',content:'',photos:[],actions:[],date:today()},recordPlantIndex:0});this.toast('这份生长，记住了');},
 deleteNote(e){
   const id=e.currentTarget.dataset.id;
   this.openConfirmation('删除这条日记？','删除后无法恢复。',()=>{
     const before=this.db.notes;
     const removed=before.find(note=>note.id===id);
     if(!removed)return;
     this.db.notes=before.filter(note=>note.id!==id);
     if(!this.save()){this.db.notes=before;return;}
     this.releasePhotos(removed.photos||[]);
     this.refresh();
   },'删除',true);
 },
 finishPlant(){
   const id=this.currentGarden;
   const plant=this.db.plants.find(item=>item.id===id);
   if(!plant)return;
   const ended=!plant.ended;
   this.openConfirmation(ended?'结束本轮种植？':'重新开始这轮种植？','种植信息和日记会保留。',()=>{
     const current=this.db.plants.find(item=>item.id===id);
     if(!current)return;
     const previous=current.ended;
     current.ended=ended;
     if(!this.save())current.ended=previous;
     this.refresh();
   },ended?'结束种植':'重新开始');
 },
 deletePlant(){
   const id=this.currentGarden;
   this.openConfirmation('移除这株植物？','已有的日记会保留。',()=>{
     const before=this.db.plants;
     const nextRootView=this.db.nextRootView;
     this.db.plants=before.filter(plant=>plant.id!==id);
     if(this.isInnerPage)this.db.nextRootView='garden';
     if(!this.save()){
       this.db.plants=before;
       if(nextRootView===undefined)delete this.db.nextRootView;
       else this.db.nextRootView=nextRootView;
       return;
     }
     this.currentGarden='';
     this.history=[];
     this.navigate('garden');
   },'移除',true);
 },
 toggleTodo(e){
   const id=e.currentTarget.dataset.id;
   const task=this.data.todos.find(todo=>todo.id===id);
   if(!task)return;
   const previous=this.db.completed;
   this.db.completed=task.done?previous.filter(item=>item!==id):previous.concat(id);
   if(!this.save()){this.db.completed=previous;return;}
   this.feedback();
   this.refresh();
 },
 openTheme(){this.savedTheme={...this.db.theme};this.setData({themeDraft:{...this.db.theme}});this.navigate('theme');},
 choosePreset(e){const theme=Themes.presets.find(t=>t.id===e.currentTarget.dataset.id);if(theme){this.setData({themeDraft:{...theme}});this.refresh();}},
 chooseColor(e){const {field,value}=e.currentTarget.dataset;this.setData({themeDraft:{...this.data.themeDraft,id:'custom',name:'我的灵感配色',[field]:value}});this.refresh();},
 randomTheme(){this.setData({themeDraft:Themes.shuffle()});this.refresh();},
 saveTheme(){const old=this.db.theme;this.db.theme=Themes.derive(this.data.themeDraft);if(!this.save()){this.db.theme=old;return;}this.savedTheme={...this.db.theme};this.doBack();this.toast('配色已保存，整个田地都换好了');},
 resetTheme(){this.setData({themeDraft:{...Themes.presets[0]}});this.refresh();},
 openTerm(e){
   const name=e.currentTarget.dataset.name;
   const term=this.data.terms.find(item=>item.id===name||item.name===name);
   if(!term)return;
   if(!this.isInnerPage){this.openInner('term',{term:term.id});return;}
   this.setData({term});
   this.navigate('term');
 },
 openPlantingCity(){
   if(!Location.enabled)return;
   const region=this.db.plantingLocation?.region||[];
   this.setData({sheet:'plantingCity',regionDraft:RegionPicker.initial(region),canLocatePlantingRegion:Boolean(Location.locate)});
 },
 initializePlantingLocation(){
   if(!Location.enabled)return;
   if(!Location.locate||this.isInnerPage||this.data.view!=='home'||!this.db.guideSeen||this.db.locationAsked||this.getPlantingPlace())return;
   this.db.locationAsked=true;
   this.save();
   return this.detectPlantingLocation();
 },
 async detectPlantingLocation(){
   if(!Location.enabled||!Location.locate||this.data.locatingPlantingRegion)return;
   const previous=JSON.stringify(this.db.plantingLocation);
   this.setData({locatingPlantingRegion:true});
   try{
     const result=await WeatherEffects.detectRegion(Location.locate);
     if(JSON.stringify(this.db.plantingLocation)===previous)return this.setPlantingLocation(result);
   }catch(e){
     if(JSON.stringify(this.db.plantingLocation)!==previous||this.data.view!=='home')return;
     if(this.data.sheet&&this.data.sheet!=='plantingCity')return;
     this.openPlantingCity();
     this.setData({plantingLocationHint:'可手动选择省、市、区。'});
   }finally{
     this.setData({locatingPlantingRegion:false});
   }
 },
 chooseRegionPart(e){
   const {level,value}=e.currentTarget.dataset;
   const {province,city,district}=this.data.regionDraft;
   if(level==='province'){
     if(value===province)return;
     this.setData({regionDraft:RegionPicker.initial([value])});
   }else if(level==='city'){
     if(value===city)return;
     this.setData({regionDraft:RegionPicker.selection([province,value])});
   }else if(level==='district'&&value!==district){
     this.setData({regionDraft:RegionPicker.selection([province,city,value])});
   }
 },
 savePlantingRegion(){
   if(!Location.enabled)return;
   const {province,city,district}=this.data.regionDraft;
   if(!district)return;
   return this.setPlantingLocation({region:[province,city,district]});
 },
 setPlantingLocation(location){
   const previous=this.db.plantingLocation;
   this.db.plantingLocation=location;
   if(!this.save()){
     this.db.plantingLocation=previous;
     return;
   }
   this.setData({sheet:this.data.sheet==='plantingCity'?'':this.data.sheet,plantingLocationHint:'',weatherEffect:''});
   return this.updateWeatherEffect();
 },
 getPlantingPlace(){
   const saved=this.db.plantingLocation;
   if(saved?.region?.length)return {...saved,id:JSON.stringify(saved.region),name:WeatherEffects.regionLabel(saved.region)};
   return WeatherEffects.cities.find(city=>city.id===this.db.weatherCityId);
 },
 hideFailedPlantPhoto(e){
   const {id}=e.currentTarget.dataset;
   if(!this.data.failedPlantPhotos?.[id]){
     this.setData({failedPlantPhotos:{...this.data.failedPlantPhotos,[id]:true}});
   }
 },
 async updateWeatherEffect(){
   if(this.data.view!=='home')return;
   const city=this.getPlantingPlace();
   this.setData({plantingCityName:city?.name||''});
   const cached=this.weatherEffectCache;
   if(cached&&cached.cityId===city?.id&&Date.now()<cached.expiresAt){
     this.setData({weatherEffect:cached.effect});
     return;
   }
   this.setData({weatherEffect:''});
   if(!city||this.weatherEffectRequest?.cityId===city.id)return;
   const request={cityId:city.id};
   this.weatherEffectRequest=request;
   try{
     const place=Number.isFinite(city.latitude)?city:await WeatherEffects.lookupRegion({region:city.region});
     if(this.weatherEffectRequest!==request||this.getPlantingPlace()?.id!==city.id)return;
     const effect=await WeatherEffects.getEffect(place);
     if(this.weatherEffectRequest!==request||this.getPlantingPlace()?.id!==city.id)return;
     this.weatherEffectCache={cityId:city.id,effect,expiresAt:Date.now()+10*60*1000};
     if(this.data.view==='home')this.setData({weatherEffect:effect});
   }catch(e){
     // Keep the default appearance when no current condition is available.
   }finally{
     if(this.weatherEffectRequest===request)this.weatherEffectRequest=null;
   }
 },
 onHide(){this.stopGrowth();clearTimeout(this.toastTimer);if(this.data.toastText)this.setData({toastText:''});},
 onUnload(){
   this.stopGrowth();
   clearTimeout(this.toastTimer);
   this.photoCorrectionDraft=null;
   this.correctionPageUnloaded=true;
   this.clearCorrectionPreview();
   this.clearCatalogZoom();
 },
 openGrowth(e){this.stopGrowth();const candidate=e&&e.currentTarget?e.currentTarget.dataset.id:'';const species=Growth.species.some(p=>p.id===candidate)?candidate:'tomato';this.setData({growthIndex:0,growth:Growth.frame(species,0),story:Growth.story(this.db,species),growthPlaying:false});this.navigate('growth');},
 changeGrowthPlant(e){this.stopGrowth();const id=e.currentTarget.dataset.id;this.setData({growthIndex:0,growth:Growth.frame(id,0),story:Growth.story(this.db,id)});},
 selectGrowthStage(e){this.stopGrowth();this.setGrowthStage(Number(e.currentTarget.dataset.index));},
 scrubGrowth(e){this.stopGrowth();this.setGrowthStage(Math.round(Number(e.detail.value)));},
 setGrowthStage(index){const frame=Growth.frame(this.data.growth.id,index);this.setData({growthIndex:frame.index,growth:frame,story:Growth.story(this.db,frame.id)});},
 stopGrowth(){if(this.growthTimer){clearInterval(this.growthTimer);this.growthTimer=null;}if(this.data.growthPlaying)this.setData({growthPlaying:false});},
 toggleGrowthPlay(){if(this.data.growthPlaying){this.stopGrowth();return;}if(this.data.growthIndex===4)this.setGrowthStage(0);this.setData({growthPlaying:true});this.growthTimer=setInterval(()=>{if(this.data.view!=='growth'){this.stopGrowth();return;}const next=this.data.growthIndex+1;this.setGrowthStage(next);if(next>=4)this.stopGrowth();},2200);},
 toggleGrowthMotion(){const on=!this.data.motionOn;if(!on)this.stopGrowth();this.setData({motionOn:on});},
 plantFromGrowth(){this.currentPlant=this.data.growth.id;this.refresh();this.addPlant();},
 recordFromGrowth(){const g=this.db.plants.find(g=>g.plantId===this.data.growth.id);this.startRecord({currentTarget:{dataset:{id:g?g.id:''}}});},
 onShareAppMessage(){return {title:'朝暮田事 · 把生活种成喜欢的样子',path:'/pages/index/index'};}
};
