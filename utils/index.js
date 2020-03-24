const fetchDB = require('./fetchDB');
const fetchSite = require('./fetchSite');

const formatArray = require('./formatArray');
const formatString = require('./formatString');
const formatNumber = require('./formatNumber');
const formatCurrency = require('./formatCurrency');
const formatRewards = require('./formatRewards');

const getPriceStatus = require('./getPriceStatus');
const getDay = require('./getDay');
const getDaily = require('./getDaily');
const getWeekly = require('./getWeekly');
const getEventQuests = require('./getEventQuests');
const getUTCTimeDifference = require('./getUTCTimeDifference');
const getChannelId = require('./getChannelId');
const getRoleId = require('./getRoleId');
const getGuildSettings = require('./getGuildSettings');
const getRewards = require('./getRewards');
const getGlobalSetting = require('./getGlobalSetting');
const getChallengesList = require('./getChallengesList');
const getAuthorPermission = require('./getAuthorPermission');

module.exports = {
  fetchDB,
  fetchSite,
  
  formatArray,
  formatString,
  formatNumber,
  formatRewards,
  formatCurrency,

  getPriceStatus,  
  getDay,
  getDaily,
  getWeekly,
  getEventQuests,
  getUTCTimeDifference,
  getChannelId,
  getRoleId,
  getGuildSettings,
  getRewards,  
  getGlobalSetting,
  getChallengesList,
  getAuthorPermission,
}