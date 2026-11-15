// Public service origin only. Never add WeChat AppSecret, weather keys or
// database credentials here. This origin is the deployed Worker custom domain.
module.exports={
  API_BASE:'https://chaomu-api.hibutuo.com',
  // Keep this false until the mini program has passed the traffic-owner review
  // and a real Banner ad unit has been created in the WeChat console.
  // An adUnitId is public; AppSecret, API keys and payment keys never belong here.
  AD_ENABLED:false,
  PLANT_DETAIL_BANNER_AD_UNIT_ID:''
};
