// The endpoint belongs to your server, never place AppSecret in a mini program.
const client=require('../services/client');
function isConfigured(){return client.isConfigured();}
function signIn(){
  return new Promise((resolve,reject)=>{
    if(!isConfigured()){reject(new Error('API_BASE_NOT_CONFIGURED'));return;}
    wx.login({success:login=>{
      if(!login.code){reject(new Error('WX_LOGIN_FAILED'));return;}
      client.request('/v1/auth/wechat',{method:'POST',data:{code:login.code}}).then(result=>{if(result&&result.accessToken)client.setAccessToken(result.accessToken);resolve(result);},reject);
    },fail:reject});
  });
}
function signOut(){client.setAccessToken('');}
module.exports={isConfigured,signIn,signOut};
