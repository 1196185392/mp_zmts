const definition = require('../index/page-definition');
const Themes = require('../../utils/themes');
const theme = Themes.derive(Themes.presets.find(preset => preset.id === 'night'));
Page({...definition, data: {...definition.data, theme, themeStyle: Themes.css(theme)}});
