const weather = require('./weather');
const client = require('../services/client');

// Approximate city centres. Selecting a city does not access device location.
const cities = [
  {id:'beijing', name:'北京', latitude:39.90, longitude:116.41},
  {id:'shanghai', name:'上海', latitude:31.23, longitude:121.47},
  {id:'guangzhou', name:'广州', latitude:23.13, longitude:113.26},
  {id:'shenzhen', name:'深圳', latitude:22.54, longitude:114.06},
  {id:'hangzhou', name:'杭州', latitude:30.27, longitude:120.15},
  {id:'nanjing', name:'南京', latitude:32.06, longitude:118.80},
  {id:'chengdu', name:'成都', latitude:30.57, longitude:104.07},
  {id:'chongqing', name:'重庆', latitude:29.56, longitude:106.55},
  {id:'wuhan', name:'武汉', latitude:30.59, longitude:114.31},
  {id:'xian', name:'西安', latitude:34.34, longitude:108.94},
  {id:'kunming', name:'昆明', latitude:24.88, longitude:102.83},
  {id:'harbin', name:'哈尔滨', latitude:45.80, longitude:126.53}
];

async function getEffect(city) {
  const current = await weather.fetchCurrent(city);
  if (current.source === 'qweather' && ['sunny', 'rain', 'snow'].includes(current.kind)) {
    return current.kind;
  }
  return '';
}

function lookupRegion(data) {
  return client.request('/v1/context/region',{method:'POST',data,timeout:8000,authenticated:false});
}

async function detectRegion(locate) {
  if(typeof wx.requirePrivacyAuthorize==='function'){
    await new Promise((resolve,reject)=>wx.requirePrivacyAuthorize({success:resolve,fail:reject}));
  }
  const {latitude,longitude}=await new Promise((resolve,reject)=>{
    locate({type:'wgs84',success:resolve,fail:reject});
  });
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude))throw new Error('LOCATION_UNAVAILABLE');
  return lookupRegion({latitude:Number(latitude.toFixed(2)),longitude:Number(longitude.toFixed(2))});
}

function regionLabel(region) {
  const [province,city,district]=region;
  const provinceName=province?.replace(/市$/,'');
  const cityName=city?.replace(/市$/,'');
  const parts=[province];
  if(cityName!==provinceName)parts.push(city);
  if(district!==city&&district!==province)parts.push(district);
  return parts.filter(name=>name&&!['市辖区','县','省直辖县级行政区划','自治区直辖县级行政区划'].includes(name)).join(' · ');
}

module.exports = {cities, getEffect, lookupRegion, detectRegion, regionLabel};
