const {API_BASE}=require('../config');
const TOKEN_KEY='chaomu-tianshi-access-token';
function isConfigured(){return /^https:\/\//.test(API_BASE);}
function accessToken(){try{return wx.getStorageSync(TOKEN_KEY)||'';}catch(e){return '';}}
function setAccessToken(value){try{wx.setStorageSync(TOKEN_KEY,value||'');}catch(e){}}
function request(path,{method='GET',data={},timeout,authenticated=true}={}){
  return new Promise((resolve,reject)=>{
    if(!isConfigured()){reject(new Error('API_BASE_NOT_CONFIGURED'));return;}
    const token=authenticated?accessToken():'';
    wx.request({url:API_BASE.replace(/\/$/,'')+path,method,data,...(timeout?{timeout}:{}),header:token?{Authorization:'Bearer '+token}:{},success:res=>{
      if(res.statusCode>=200&&res.statusCode<300){resolve(res.data);return;}
      const error=new Error(res.data&&res.data.code?res.data.code:'API_HTTP_'+res.statusCode);
      error.statusCode=res.statusCode;
      reject(error);
    },fail:reject});
  });
}
module.exports={isConfigured,request,accessToken,setAccessToken};
