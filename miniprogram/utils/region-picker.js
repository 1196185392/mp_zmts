const regions = require('./region-data');
const provinces = Object.keys(regions);
const municipalityGroup = name => name === '市辖区' || name === '县';

function selection([province = '', city = '', district = ''] = []) {
  const groups = Object.keys(regions[province] || {});
  const municipality = groups.some(municipalityGroup);
  const cities = municipality ? [province] : groups;
  if (!cities.includes(city)) city = '';
  const districts = city ? (municipality
    ? groups.filter(municipalityGroup).flatMap(group => regions[province][group])
    : regions[province][city]) : [];
  if (!districts.includes(district)) district = '';
  return {province, city, district, provinces, cities, districts};
}

function initial(region = []) {
  const [province, city, district] = region;
  if (!provinces.includes(province)) return selection();
  const municipality = Object.keys(regions[province]).some(municipalityGroup);
  return selection([province, municipality ? province : city, district]);
}

module.exports = {initial, selection};
