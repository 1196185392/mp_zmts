const localPlants=require('../utils/plants');
const bundledCatalog=require('../utils/bundled-catalog');
const catalogPhotoIndex=require('../utils/catalog-photo-index');
const localById=localPlants.reduce((index,plant)=>(index[plant.id]=plant,index),{});
const verifiedPhotoSpecies={
  papaya:'Carica papaya',
  guava:'Psidium guajava',
  chayote:'Sechium edule'
};

function normalizePlant(remote){
  if(!remote||typeof remote.id!=='string'||typeof remote.name!=='string')return null;
  const local=localById[remote.id]||{};
  const aliases=Array.isArray(remote.aliases)?remote.aliases:[];
  const hasCultivation=remote.cultivationVerified===true;
  const category=remote.category||local.category||'其他';
  let image='';
  if(remote.taxonomyVerified===true&&typeof remote.scientificName==='string'){
    if(verifiedPhotoSpecies[remote.id]===remote.scientificName){
      image='/assets/photo-'+remote.id+'.jpg';
    }else if(catalogPhotoIndex[remote.id]===remote.scientificName){
      image='/assets/catalog-photos/photo-'+remote.id+'.jpg';
    }
  }
  return {
    ...local,
    id:remote.id,
    name:remote.name,
    en:remote.scientificName||local.en||'',
    category,
    tag:hasCultivation?(local.tag||'田地新朋友'):'养护资料整理中',
    days:hasCultivation?(local.days||null):null,
    daysLabel:hasCultivation?`${local.days||'—'} 天`:'待权威资料发布',
    months:hasCultivation?(local.months||[]):[],
    sow:hasCultivation?(local.sow||[]):[],
    harvest:hasCultivation?(local.harvest||[]):[],
    period:hasCultivation?(local.period||'按当地条件确定'):'待权威资料发布',
    summary:remote.summary||local.summary||'',
    alias:aliases.join('、')||local.alias||'',
    light:hasCultivation?(remote.light||local.light||'因品种而异'):'待权威资料发布',
    temp:hasCultivation?(remote.temp||local.temp||'因品种而异'):'待权威资料发布',
    space:hasCultivation?(remote.container||local.space||'按品种选择'):'待权威资料发布',
    image,
    taxonomyStatus:remote.taxonomyVerified===true?'分类已核验':'分类待复核',
    cultivationStatus:hasCultivation?'养护已核验':'养护建议待核验',
    hasCultivation
  };
}

const bundledPlants=bundledCatalog.map(normalizePlant);
module.exports={bundledPlants,normalizePlant};
