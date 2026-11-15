const Client=require('./client');
const {API_BASE}=require('../config');

let previousOverrides={};
let nextRefresh=0;
let pending;

function photoUrl(plantId,revision=''){
  const base=API_BASE.replace(/\/$/,'');
  return base+'/v1/catalog/photos/'+encodeURIComponent(plantId)+(revision?'?revision='+encodeURIComponent(revision):'');
}

function overrides(){
  if(Date.now()<nextRefresh)return Promise.resolve(previousOverrides);
  if(pending)return pending;
  pending=Client.request('/v1/catalog/photo-overrides',{authenticated:false,timeout:6500})
    .then(result=>{
      const entries=Array.isArray(result.items)?result.items:[];
      const next={};
      for(const {id,revision} of entries){
        if(/^[a-z0-9-]{1,80}$/.test(id)&&/^[a-f0-9-]{36}$/.test(revision))next[id]=revision;
      }
      previousOverrides=next;
      nextRefresh=Date.now()+2*60*1000;
      return next;
    })
    .catch(()=>{
      nextRefresh=Date.now()+30*1000;
      return previousOverrides;
    })
    .finally(()=>{pending=null;});
  return pending;
}

function loadDetail(plantId,revision){
  return new Promise((resolve,reject)=>{
    if(!Client.isConfigured())return reject(new Error('PHOTO_OFFLINE'));
    wx.request({
      url:photoUrl(plantId,revision),responseType:'arraybuffer',timeout:12000,
      success:res=>{
        if(res.statusCode!==200||!res.data||res.data.byteLength>3*1024*1024)return resolve('');
        const bytes=new Uint8Array(res.data);
        if(bytes.length<3||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)return resolve('');
        const path=wx.env.USER_DATA_PATH+'/catalog-zoom-'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.jpg';
        wx.getFileSystemManager().writeFile({filePath:path,data:res.data,success:()=>resolve(path),fail:reject});
      },
      fail:reject,
    });
  });
}

function release(path){
  if(path)wx.getFileSystemManager().unlink({filePath:path,fail(){}});
}

module.exports={overrides,photoUrl,loadDetail,release};
