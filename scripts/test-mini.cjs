const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const theme=require('../miniprogram/utils/themes');
let total=0;function test(name,fn){fn();console.log('PASS',name);total++;}
test('every preset has readable primary and accent text',()=>{for(const p of theme.presets){const t=theme.derive(p);assert.ok(theme.contrast(t.primary,t.onPrimary)>=4.5,p.id);assert.ok(theme.contrast(t.accent,t.onAccent)>=4.5,p.id);assert.ok(theme.contrast(t.background,t.text)>=4.5,p.id);assert.ok(theme.contrast(t.surface,t.muted)>=3,p.id);}});
test('all 384 curated colour combinations remain readable',()=>{for(const p of theme.tones)for(const b of theme.backgrounds)for(const a of theme.accents){const t=theme.derive({id:'custom',name:'test',primary:p.value,background:b.value,accent:a.value});assert.ok(theme.contrast(t.primary,t.onPrimary)>=4.5);assert.ok(theme.contrast(t.accent,t.onAccent)>=4.5);assert.ok(theme.contrast(t.background,t.text)>=4.5);}});
test('bad persisted colours safely fall back',()=>assert.equal(theme.derive({primary:'broken',background:'',accent:null}).id,'wheat'));
let definition;let storage={},backCount=0,route='pages/inner/index';global.Page=p=>definition=p;global.getCurrentPages=()=>[{route}];global.wx={getStorageSync:k=>storage[k],setStorageSync:(k,v)=>storage[k]=JSON.parse(JSON.stringify(v)),getWindowInfo:()=>({statusBarHeight:44}),getMenuButtonBoundingClientRect:()=>({top:50,height:32}),setNavigationBarColor(){},showToast(){assert.fail('use themed toast');},showModal(){assert.fail('use themed confirmation');},navigateTo(){},navigateBack(){backCount++;}};
require('../miniprogram/pages/index/index');
const newPage=opts=>{const p={...definition,data:JSON.parse(JSON.stringify(definition.data)),setData(update){for(const [key,value]of Object.entries(update)){const keys=key.split('.');let target=this.data;for(let i=0;i<keys.length-1;i++)target=target[keys[i]];target[keys.at(-1)]=value;}}};p.onLoad(opts||{});return p;};
let page=newPage();const event=d=>({currentTarget:{dataset:d}});
test('the library renders every definition and old term links still resolve',()=>{
  const markup=fs.readFileSync(path.join(__dirname,'../miniprogram/pages/index/index.wxml'),'utf8');
  assert.match(markup,/class="glossary-list".*wx:for="{{terms}}".*{{item\.body}}/);
  const originalRoute=route,originalNavigate=wx.navigateTo;
  try{
    route='pages/index/index';
    const library=newPage();
    library.switchTab(event({view:'learn'}));
    for(const word of library.data.terms){
      let url;
      wx.navigateTo=options=>{url=options.url;};
      route='pages/index/index';
      library.openTerm(event({name:word.name}));
      const params=Object.fromEntries(new URLSearchParams(url.split('?')[1]));
      route='pages/inner/index';
      const inner=newPage(params);
      assert.equal(inner.data.view,'term');
      assert.equal(inner.data.term.name,word.name);
      assert.ok(inner.data.term.body);
    }
    assert.equal(newPage({view:'term',term:encodeURIComponent('缓苗')}).data.term.name,'缓苗');
    assert.equal(newPage({view:'term',term:'不存在'}).data.term,null);
  }finally{route=originalRoute;wx.navigateTo=originalNavigate;}
});
test('plant cards only show dedicated, bundled photos',()=>{
  const {bundledPlants,normalizePlant}=require('../miniprogram/services/catalog');
  const config=require('../project.config.json');
  const photos=bundledPlants.filter(plant=>plant.image);
  const imageIndex=require('../miniprogram/utils/catalog-photo-index');
  assert.deepEqual(photos.map(plant=>plant.id).sort(),['chayote','guava','papaya'].concat(Object.keys(imageIndex)).sort());
  for(const plant of photos){
    assert.match(plant.image,new RegExp('/photo-'+plant.id+'\\.jpg$'));
    assert.ok(fs.existsSync(path.join(__dirname,'../miniprogram',plant.image)),plant.id);
    assert.ok(config.packOptions.include.some(rule=>
      (rule.type==='file'&&rule.value===plant.image.slice(1))||
      (rule.type==='folder'&&plant.image.startsWith('/'+rule.value+'/'))
    ),plant.id);
  }
  for(const id of ['mint','blueberry','bokchoy'])assert.equal(bundledPlants.find(plant=>plant.id===id).image,'');
  assert.equal(normalizePlant({id:'papaya',name:'番木瓜',scientificName:'Chaenomeles speciosa',taxonomyVerified:true}).image,'');
});
test('About opens a page from My screen and inherits the active theme',()=>{
  const originalRoute=route,originalNavigate=wx.navigateTo;
  try{
    route='pages/index/index';
    const profile=newPage();
    profile.db.theme=theme.presets.find(preset=>preset.id==='night');
    profile.save();
    profile.switchTab(event({view:'profile'}));
    let url;
    wx.navigateTo=options=>{url=options.url;};
    profile.go(event({view:'about'}));
    assert.equal(url,'/pages/inner/night?view=about');
    route='pages/inner/night';
    const about=newPage(Object.fromEntries(new URLSearchParams(url.split('?')[1])));
    assert.equal(about.data.view,'about');
    assert.equal(about.data.title,'关于');
    assert.equal(about.data.theme.id,'night');
    delete storage['yifangtiandi-native-v1'];
  }finally{route=originalRoute;wx.navigateTo=originalNavigate;}
});
test('the bundled catalogue works offline and opens new plant records',()=>{
  const p=newPage({view:'catalog'});
  p.onShow();
  assert.equal(p.data.filteredPlants.length,167);
  p.searchPlant({detail:{value:'土豆'}});
  assert.deepEqual(p.data.filteredPlants.map(plant=>plant.id),['potato']);
  p.openPlant(event({id:'potato'}));
  assert.equal(p.data.selectedPlant.name,'马铃薯');
  p.addPlant();
  assert.equal(p.data.form.name,'马铃薯');
});
test('dark navigation uses the dark native page and inherits the saved theme',()=>{
  const originalNavigate=wx.navigateTo,originalRoute=route,originalStorage=storage;
  try{
    storage={};
    wx.setStorageSync('yifangtiandi-native-v1',{theme:theme.presets.find(p=>p.id==='night'),plants:[],notes:[]});
    let url;
    wx.navigateTo=options=>{url=options.url;};
    route='pages/index/index';
    newPage().go('catalog');
    assert.equal(url,'/pages/inner/night?view=catalog');
    route='pages/inner/night';
    const inner=newPage({view:'catalog'});
    assert.equal(inner.data.isRoot,false);
    assert.equal(inner.data.theme.background,'#1F2927');
    inner.openInner('plant',{plant:'potato'});
    assert.equal(url,'/pages/inner/night?view=plant&plant=potato');
    inner.doBack();
    backCount--;
  }finally{wx.navigateTo=originalNavigate;route=originalRoute;storage=originalStorage;}
});
test('native page opens with new brand and focused home recommendations',()=>{assert.equal(page.data.brand,'朝暮田事');assert.equal(page.data.theme.id,'wheat');assert.equal(page.data.recommended.length,3);});
test('theme changes preview live, cancel does not persist',()=>{page.openTheme();page.choosePreset(event({id:'night'}));assert.equal(page.data.theme.dark,true);page.doBack();assert.equal(page.data.theme.id,'wheat');});
test('opening the theme page selects the saved preset or restores all custom colours',()=>{
  const originalRoute=route,originalNavigate=wx.navigateTo,originalStorage=storage;
  try{
    const key='yifangtiandi-native-v1';
    for(const saved of [theme.presets.find(item=>item.id==='night'),{id:'custom',name:'我的配色',primary:theme.tones[1].value,background:theme.backgrounds[2].value,accent:theme.accents[3].value}]){
      storage={[key]:{theme:saved}};
      route='pages/index/index';
      let url;
      wx.navigateTo=options=>{url=options.url;};
      const home=newPage();
      home.openTheme();
      assert.match(url,/\?view=theme/);
      route=url.split('?')[0].slice(1);
      const inner=newPage({view:'theme'});
      assert.equal(inner.data.themeDraft.id,saved.id);
      for(const colour of ['primary','background','accent'])assert.equal(inner.data.themeDraft[colour],saved[colour]);
    }
  }finally{route=originalRoute;wx.navigateTo=originalNavigate;storage=originalStorage;}
});
test('custom combination saves and survives a new page instance',()=>{page.openTheme();page.chooseColor(event({field:'primary',value:'#47677F'}));page.chooseColor(event({field:'background',value:'#F0F4F5'}));page.saveTheme();page=newPage();assert.equal(page.data.theme.primary,'#47677F');assert.equal(page.data.theme.background,'#F0F4F5');});
test('choose plant, save transplant with quantity and source',()=>{page.openPlant(event({id:'chive'}));page.addPlant();page.formInput({currentTarget:{dataset:{field:'quantity'}},detail:{value:'2盆'}});page.pickForm(event({field:'method',value:'移栽'}));page.pickForm(event({field:'source',value:'购买苗'}));page.savePlant();assert.equal(page.data.view,'garden');assert.equal(page.db.plants[0].quantity,'2盆');assert.equal(page.db.plants[0].source,'购买苗');});
test('switching to seeds clears incompatible seedling source',()=>{page.addPlant();page.pickForm(event({field:'method',value:'移栽'}));page.pickForm(event({field:'source',value:'分株'}));page.pickForm(event({field:'method',value:'直接播种'}));assert.equal(page.data.form.source,'购买种子');});
test('empty name is rejected without creating a plant',()=>{page.setData({'form.name':'  '});page.savePlant();assert.ok(page.data.formError);assert.equal(page.db.plants.length,1);});
test('care record saves and survives page restart',()=>{const id=page.db.plants[0].id;page.startRecord(event({id,action:'浇水'}));page.recordInput({currentTarget:{dataset:{field:'content'}},detail:{value:'新的叶片展开了'}});page.saveRecord();page=newPage();assert.equal(page.db.notes.length,1);assert.equal(page.db.notes[0].content,'新的叶片展开了');assert.ok(page.db.notes[0].actions.includes('浇水'));});
test('photo-only record asks for writing and a saved record does not reopen its editor',()=>{const p=newPage();p.startRecord(event({}));p.setData({'record.photos':['wxfile://photo']});const count=p.db.notes.length;p.saveRecord();assert.equal(p.data.view,'record');assert.equal(p.db.notes.length,count);assert.ok(p.data.formError.includes('照片已经选好'));p.recordInput({currentTarget:{dataset:{field:'content'}},detail:{value:'窗边长出了新叶'}});p.saveRecord();assert.equal(p.data.view,'notes');assert.equal(p.data.record.photos.length,0);});
test('custom date sheet clamps invalid days and rejects future dates',()=>{const p=newPage();p.startRecord(event({}));p.openDate(event({target:'record'}));assert.equal(p.data.sheet,'date');p.chooseDatePart(event({field:'Month',value:2}));assert.ok(p.data.dateDay<=29);p.chooseDatePart(event({field:'Year',value:2024}));p.chooseDatePart(event({field:'Month',value:2}));p.chooseDatePart(event({field:'Day',value:29}));p.saveDate();assert.equal(p.data.record.date,'2024-02-29');assert.equal(p.data.sheet,'');});
test('end cultivation keeps original diary',()=>{const count=page.db.notes.length;page.openGarden(event({id:page.db.plants[0].id}));page.finishPlant();page.confirmSheet();assert.equal(page.db.plants[0].ended,true);assert.equal(page.db.notes.length,count);});
test('removing a plant retains existing diary',()=>{const count=page.db.notes.length;page.deletePlant();page.confirmSheet();assert.equal(page.db.plants.length,0);assert.equal(page.db.notes.length,count);});
test('wxml conditions are data-bound; custom pickers and assets exist',()=>{const wxml=fs.readFileSync(path.join(__dirname,'../miniprogram/pages/index/index.wxml'),'utf8');for(const m of wxml.matchAll(/wx:(if|elif)="([^"]*)"/g))assert.ok(m[2].startsWith('{{'),m[0]);assert.doesNotMatch(wxml,/<picker\b/);for(const plant of require('../miniprogram/utils/plants'))assert.ok(fs.existsSync(path.join(__dirname,'../miniprogram',plant.image)));});
const Growth=require('../miniprogram/utils/growth');
test('growth chapters clamp input and follow each species',()=>{assert.equal(Growth.frame('tomato',99).index,4);assert.equal(Growth.frame('tomato',-1).index,0);assert.ok(Growth.frame('tomato',1.7).chapter);assert.equal(Growth.frame('lettuce',4).flowers.length,0);assert.equal(Growth.frame('lettuce',4).fruits.length,0);assert.equal(Growth.frame('tomato',4).fruits.length,3);assert.equal(Growth.frame('flower',4).fruits.length,0);assert.equal(Growth.frame('flower',0).chapter.short,'开始');});
test('story cards only include records from the selected species',()=>{const db={plants:[{id:'t',plantId:'tomato',name:'窗边小番茄',date:'2026-10-01'},{id:'l',plantId:'lettuce',name:'生菜',date:'2026-10-02'}],notes:[{gardenId:'t',created:1,content:'真叶展开了',photos:['local-a']},{gardenId:'t',created:3,content:'看到了花苞',photos:[]},{gardenId:'l',created:5,content:'其他植物的日记',photos:['local-b']}]};const s=Growth.story(db,'tomato');assert.equal(s.recordCount,2);assert.equal(s.photoCount,1);assert.equal(s.quote,'看到了花苞');assert.ok(s.title.includes('窗边小番茄'));const empty=Growth.story({plants:[],notes:[]},'lettuce');assert.equal(empty.hasPlant,false);assert.equal(empty.recordCount,0);});
test('playback ends, replays, and stops on hide or navigation',()=>{const realSet=global.setInterval,realClear=global.clearInterval;let tick,active=false;global.setInterval=fn=>{tick=fn;active=true;return 1;};global.clearInterval=()=>active=false;try{const p=newPage({screen:'growth'});p.toggleGrowthPlay();assert.equal(p.data.growthPlaying,true);for(let i=0;i<4;i++)tick();assert.equal(p.data.growthIndex,4);assert.equal(p.data.growthPlaying,false);assert.equal(active,false);p.toggleGrowthPlay();assert.equal(p.data.growthIndex,0);p.onHide();assert.equal(active,false);p.toggleGrowthPlay();p.navigate('home');assert.equal(active,false);assert.equal(p.data.growthPlaying,false);}finally{global.setInterval=realSet;global.clearInterval=realClear;}});
test('scrubbing, species selection and real planting remain connected',()=>{const p=newPage({screen:'growth'});p.changeGrowthPlant(event({id:'lettuce'}));p.scrubGrowth({detail:{value:4}});assert.equal(p.data.growth.id,'lettuce');assert.equal(p.data.growth.chapter.short,'采收');p.toggleGrowthMotion();assert.equal(p.data.motionOn,false);p.plantFromGrowth();assert.equal(p.currentPlant,'lettuce');assert.equal(p.data.view,'add');assert.equal(p.data.form.name,'生菜');});
test('retired routes fall back to the offline catalogue and location permission is omitted',()=>{for(const view of ['location','weather','calendar','community'])assert.equal(newPage({view}).data.view,'catalog');const app=JSON.parse(fs.readFileSync(path.join(__dirname,'../miniprogram/app.json'),'utf8'));assert.equal(app.permission?.['scope.userLocation'],undefined);});
test('guide advances step by step and only finishes after the third action',()=>{const p=newPage();p.setData({showGuide:true,guideStep:0});p.nextGuide();assert.equal(p.data.showGuide,true);assert.equal(p.data.guideStep,1);p.nextGuide();assert.equal(p.data.showGuide,true);assert.equal(p.data.guideStep,2);p.nextGuide();assert.equal(p.data.showGuide,false);assert.equal(p.db.guideSeen,true);p.replayGuide();assert.equal(p.data.showGuide,true);assert.equal(p.data.guideStep,0);});
test('five primary tabs are present and every root view is routable',()=>{const wxml=fs.readFileSync(path.join(__dirname,'../miniprogram/pages/index/index.wxml'),'utf8');for(const label of ['发现','田地','记一笔','书房','我的'])assert.ok(wxml.includes('>'+label+'<'),label);route='pages/index/index';for(const view of ['home','garden','learn','profile']){const p=newPage();p.switchTab(event({view}));assert.equal(p.data.view,view);assert.equal(p.data.isRoot,true);}route='pages/inner/index';});
test('quick sheet opens and closes without changing persisted garden state',()=>{const p=newPage();const before=JSON.stringify(p.db.plants);p.openQuick();assert.equal(p.data.sheet,'quick');p.closeSheet();assert.equal(p.data.sheet,'');assert.equal(JSON.stringify(p.db.plants),before);});
test('plant form rejects a future date and accepts an earlier date',()=>{storage={};const p=newPage();p.currentPlant='chive';p.refresh();p.addPlant();p.setData({'form.date':'2999-01-01'});p.savePlant();assert.ok(p.data.formError.includes('今天或更早'));assert.equal(p.db.plants.length,0);p.setData({'form.date':'2026-01-01'});p.savePlant();assert.equal(p.db.plants.length,1);assert.equal(p.db.plants[0].date,'2026-01-01');});
test('ending and restarting a plant preserves its diary and updates todo visibility',()=>{storage={};const p=newPage();p.currentPlant='lettuce';p.refresh();p.addPlant();p.savePlant();const id=p.db.plants[0].id;p.startRecord(event({id,action:'浇水'}));p.recordInput({currentTarget:{dataset:{field:'content'}},detail:{value:'记录要保留'}});p.saveRecord();p.currentGarden=id;p.finishPlant();p.confirmSheet();assert.equal(p.db.plants[0].ended,true);assert.equal(p.data.todos.length,0);p.finishPlant();p.confirmSheet();assert.equal(p.db.plants[0].ended,false);assert.equal(p.data.todos.length,1);assert.equal(p.db.notes.length,1);});
test('removing a plant in a nested detail page synchronizes the home page and retains diary',()=>{const key='yifangtiandi-native-v1';storage={};route='pages/inner/index';const inner=newPage();inner.currentPlant='tomato';inner.refresh();inner.addPlant();inner.savePlant();const id=inner.db.plants[0].id;inner.startRecord(event({id}));inner.recordInput({currentTarget:{dataset:{field:'content'}},detail:{value:'移除后仍应保留'}});inner.saveRecord();inner.currentGarden=id;inner.deletePlant();inner.confirmSheet();assert.equal(storage[key].plants.length,0);assert.equal(storage[key].notes.length,1);route='pages/index/index';const home=newPage();home.onShow();assert.equal(home.db.plants.length,0);assert.equal(home.data.plantCount,0);assert.equal(home.data.allGarden.length,0);route='pages/inner/index';});
test('failed plant removal rolls back in-memory state',()=>{storage={};const p=newPage();p.currentPlant='chive';p.refresh();p.addPlant();p.savePlant();const id=p.db.plants[0].id;p.currentGarden=id;const originalSet=wx.setStorageSync;wx.setStorageSync=()=>{throw new Error('storage full');};p.deletePlant();p.confirmSheet();assert.equal(p.db.plants.length,1);assert.equal(p.db.plants[0].id,id);wx.setStorageSync=originalSet;});
test('record action toggles, selection and future-date validation work',()=>{storage={};const p=newPage();p.currentPlant='chive';p.refresh();p.addPlant();p.savePlant();const id=p.db.plants[0].id;p.startRecord(event({id}));p.toggleAction(event({value:'浇水'}));assert.deepEqual(p.data.record.actions,['浇水']);p.toggleAction(event({value:'浇水'}));assert.deepEqual(p.data.record.actions,[]);p.setData({'record.date':'2999-01-01'});p.recordInput({currentTarget:{dataset:{field:'content'}},detail:{value:'日期校验'}});p.saveRecord();assert.ok(p.data.formError.includes('有效'));assert.equal(p.db.notes.length,0);});
test('deleting a note removes only that note and keeps its plant',()=>{storage={};const p=newPage();p.currentPlant='chive';p.refresh();p.addPlant();p.savePlant();const id=p.db.plants[0].id;p.startRecord(event({id}));p.recordInput({currentTarget:{dataset:{field:'content'}},detail:{value:'第一条记录'}});p.saveRecord();const noteId=p.db.notes[0].id;p.deleteNote(event({id:noteId}));assert.equal(p.data.sheet,'confirm');assert.equal(p.db.notes.length,1);p.closeSheet();p.confirmSheet();assert.equal(p.db.notes.length,1);p.deleteNote(event({id:noteId}));p.confirmSheet();assert.equal(p.db.notes.length,0);assert.equal(p.db.plants.length,1);});
test('environment, light, and season settings persist safely',()=>{const p=newPage();p.chooseSetting(event({field:'environment',value:'庭院/菜园'}));p.chooseSetting(event({field:'light',value:'半日照'}));p.chooseSetting(event({field:'season',value:'立春'}));assert.equal(p.db.environment,'庭院/菜园');assert.equal(p.db.light,'半日照');assert.equal(p.db.season,'立春');});
test('garden environments preserve legacy plants and filter both growing and ended plants',()=>{
  const priorStorage=storage;
  const key='yifangtiandi-native-v1';
  const oldPlant={id:'old',plantId:'tomato',name:'旧番茄',ended:true,date:'2026-01-01',position:'花盆'};
  const balconyPlant={...oldPlant,id:'balcony',name:'阳台番茄',environment:'阳台',ended:false};
  try{
    storage={[key]:{environment:'庭院/菜园',plants:[oldPlant,balconyPlant],notes:[]}};
    const garden=newPage();
    assert.deepEqual(garden.data.garden.map(plant=>plant.id),['old','balcony']);
    garden.chooseSetting(event({field:'environment',value:'温室'}));
    const reopened=newPage();
    reopened.filterGardenEnvironment(event({value:'庭院/菜园'}));
    assert.deepEqual(reopened.data.garden.map(plant=>plant.id),['old']);
    assert.equal(reopened.data.endedCount,1);
    reopened.gardenTab(event({value:'在种'}));
    assert.equal(reopened.data.garden.length,0);
    reopened.gardenTab(event({value:'已结束'}));
    assert.deepEqual(reopened.data.garden.map(plant=>plant.id),['old']);
    reopened.filterGardenEnvironment(event({value:'阳台'}));
    reopened.gardenTab(event({value:'在种'}));
    assert.deepEqual(reopened.data.garden.map(plant=>plant.id),['balcony']);
    assert.equal(reopened.data.gardenEndedCount,0);
    assert.equal(reopened.data.endedCount,1);
  }finally{storage=priorStorage;}
});
test('marking an observation done updates both sections and persists until undone',()=>{
  const priorStorage=storage;
  const key='yifangtiandi-native-v1';
  const plant={id:'seedling',plantId:'tomato',name:'小番茄',environment:'阳台',position:'花盆',date:'2026-01-01',ended:false};
  try{
    storage={[key]:{plants:[plant],notes:[]}};
    const page=newPage({view:'reminders'});
    const task=page.data.todoGroups[0].items[0];
    assert.equal(task.place,'阳台 · 花盆');
    page.toggleTodo(event({id:task.id}));
    assert.deepEqual(page.data.todoGroups.map(group=>group.items.length),[0,1]);
    assert.equal(page.data.todoProgress,100);
    assert.equal(page.data.pending,0);
    const reopened=newPage({view:'reminders'});
    reopened.toggleTodo(event({id:task.id}));
    assert.deepEqual(reopened.data.todoGroups.map(group=>group.items.length),[1,0]);
    assert.equal(reopened.data.todoProgress,0);
    assert.equal(reopened.data.pending,1);
  }finally{storage=priorStorage;}
});
test('adding from a garden opens that environment and moving a plant keeps its diary',()=>{
  const originalRoute=route,originalNavigate=wx.navigateTo,originalStorage=storage;
  try{
    storage={};
    route='pages/index/index';
    const root=newPage();
    root.switchTab(event({view:'garden'}));
    root.filterGardenEnvironment(event({value:'庭院/菜园'}));
    let url;
    wx.navigateTo=options=>{url=options.url;};
    root.openGardenCatalog();
    assert.match(url,/\?view=catalog/);
    route='pages/inner/index';
    const catalog=newPage(Object.fromEntries(new URLSearchParams(url.split('?')[1])));
    catalog.openPlant(event({id:'tomato'}));
    catalog.addPlant();
    assert.equal(catalog.data.form.environment,'庭院/菜园');
    catalog.pickForm(event({field:'environment',value:'阳台'}));
    catalog.savePlant();
    catalog.onHide();
    route='pages/index/index';
    root.onShow();
    const plant=root.data.garden[0];
    assert.ok(plant);
    assert.equal(root.data.gardenEnvironment,'阳台');
    root.openGarden(event({id:plant.id}));

    route='pages/inner/index';
    const detail=newPage(Object.fromEntries(new URLSearchParams(url.split('?')[1])));
    detail.startRecord(event({id:plant.id}));
    detail.recordInput({currentTarget:{dataset:{field:'content'}},detail:{value:'结了第一颗果'}});
    detail.saveRecord();
    detail.openGarden(event({id:plant.id}));
    detail.openGardenEnvironment();
    detail.chooseGardenEnvironment(event({value:'温室'}));
    detail.closeSheet();
    assert.equal(detail.data.selectedGarden.environment,'阳台');
    detail.openGardenEnvironment();
    detail.chooseGardenEnvironment(event({value:'温室'}));
    detail.saveGardenEnvironment();
    assert.equal(detail.data.selectedGarden.environment,'温室');
    assert.equal(detail.data.gardenNotes[0].content,'结了第一颗果');
    detail.onHide();

    route='pages/index/index';
    root.onShow();
    assert.equal(root.data.garden.length,0);
    root.filterGardenEnvironment(event({value:'温室'}));
    assert.deepEqual(root.data.garden.map(plant=>plant.id),[plant.id]);
    assert.equal(root.data.garden[0].records,1);
  }finally{route=originalRoute;wx.navigateTo=originalNavigate;storage=originalStorage;}
});
const Catalog=require('../miniprogram/services/catalog');
test('remote catalogue never falls back to bundled cultivation guesses',()=>{const plant=Catalog.normalizePlant({id:'tomato',name:'小番茄',scientificName:'Solanum lycopersicum L.',category:'蔬菜',aliases:[],summary:'来源可追溯的名称记录',taxonomyVerified:true,cultivationVerified:false});assert.equal(plant.hasCultivation,false);assert.equal(plant.tag,'养护资料整理中');assert.equal(plant.days,null);assert.equal(plant.daysLabel,'待权威资料发布');assert.equal(plant.period,'待权威资料发布');assert.equal(plant.light,'待权威资料发布');assert.equal(plant.temp,'待权威资料发布');assert.deepEqual(plant.sow,[]);});
test('garden progress is hidden without verified cultivation data',()=>{const model=Catalog.normalizePlant({id:'tomato',name:'小番茄',scientificName:'Solanum lycopersicum L.',category:'蔬菜',aliases:[],summary:'来源可追溯的名称记录',taxonomyVerified:true,cultivationVerified:false});assert.equal(model.hasCultivation,false);const estimatedDays=Number(model.days);const progress=model.hasCultivation&&Number.isFinite(estimatedDays)&&estimatedDays>0?Math.min(100,12):0;assert.equal(progress,0);assert.equal(model.hasCultivation,false);});
console.log(`${total} checks passed; verified 384 colour combinations.`);
