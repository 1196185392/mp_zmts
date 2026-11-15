const Client=require('./client');
const maxBytes=512*1024;
const canvasSize=1280;
const canvasId='correction-photo-canvas';
const adminPath='/v1/admin/plant-photo-corrections';

function callApi(method,options={}){
  return new Promise((resolve,reject)=>method({...options,success:resolve,fail:reject}));
}

async function preparePhoto(page,source){
  const {width,height,path}=await callApi(wx.getImageInfo,{src:source});
  if(!width||!height)throw new Error('INVALID_IMAGE');
  const canvas=wx.createCanvasContext(canvasId);
  const scale=Math.min(canvasSize/width,canvasSize/height);
  const drawnWidth=Math.round(width*scale);
  const drawnHeight=Math.round(height*scale);
  canvas.setFillStyle('#ffffff');
  canvas.fillRect(0,0,canvasSize,canvasSize);
  canvas.drawImage(path,(canvasSize-drawnWidth)/2,(canvasSize-drawnHeight)/2,drawnWidth,drawnHeight);
  await new Promise(resolve=>canvas.draw(false,resolve));

  const fs=wx.getFileSystemManager();
  for(const quality of [.82,.62,.42]){
    const {tempFilePath}=await callApi(options=>wx.canvasToTempFilePath(options,page),{
      canvasId,fileType:'jpg',quality,
      width:canvasSize,height:canvasSize,destWidth:canvasSize,destHeight:canvasSize,
    });
    const {data}=await callApi(options=>fs.readFile(options),{filePath:tempFilePath});
    if(data.byteLength<=maxBytes){
      return {photo:wx.arrayBufferToBase64(data),preview:tempFilePath};
    }
  }
  throw new Error('PHOTO_TOO_LARGE');
}

function submit(plantId,photo,note,authorized){
  return Client.request('/v1/plant-photo-corrections',{
    method:'POST',data:{plantId,photo,note,authorized},timeout:20000,
  });
}

function list(status){
  return Client.request(adminPath+'?status='+encodeURIComponent(status));
}

async function saveReviewPreview(id){
  const {photo}=await Client.request(adminPath+'/'+encodeURIComponent(id));
  const fs=wx.getFileSystemManager();
  const filePath=wx.env.USER_DATA_PATH+'/correction-'+id+'.jpg';
  await callApi(options=>fs.writeFile(options),{filePath,data:photo,encoding:'base64'});
  return filePath;
}

function review(id,status){
  return Client.request(adminPath+'/'+encodeURIComponent(id),{method:'PATCH',data:{status}});
}

module.exports={preparePhoto,submit,list,saveReviewPreview,review};
