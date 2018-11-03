var pinyin = require('./pinyin.js');

var app = getApp();
const wxurl = app.globalData.wxUrl;
var dict = {};

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return [year, month, day].map(formatNumber).join('-')
}

const getPreDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()

  return [year, month, day].map(formatNumber).join('-')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

//取用户名
function getUserName(){
	var username = wx.getStorageSync('username');
	if (!username) {
		app.register();
		username = wx.getStorageSync('username')
	}
	return username;
}
//计算减法用
function numSub (num1, num2) {
	var baseNum, baseNum1, baseNum2;
	var precision;// 精度 
	try {
		baseNum1 = num1.toString().split(".")[1].length;
	} catch (e) {
		baseNum1 = 0;
	}
	try {
		baseNum2 = num2.toString().split(".")[1].length;
	} catch (e) {
		baseNum2 = 0;
	}
	baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
	precision = (baseNum1 >= baseNum2) ? baseNum1 : baseNum2;
	return ((num1 * baseNum - num2 * baseNum) / baseNum).toFixed(precision);
}
function httpG(url, data, callback) {
	wx.showLoading({
		title: '努力加载中^^...',
	})
	wx.request({
		url: wxurl+url,
		data: data,
		success: function (res) {
			callback(res.data);
		},
		fail: function (res) {
			console.log('request-get error:', res);
		},
		complete: function (res) {
			wx.hideLoading();
			 // console.log("get-complete:", res.data)
			  if (res.data.code && res.data.code != 0 && res.data.msg) {
				wx.showToast({
					 title: res.data.msg,
				})
			}
		}
	})
}
function httpP(url, data, callback) {
  wx.request({
    url: wxurl + url,
    data: data,
    method: "post",
    success: function (res) {
        callback(res.data);
    },
    fail: function (res) {
      console.log('request-post error:', res);
    },
    complete: function (res) {
      //console.log("post-complete:", res.data)
	  if (res.data.code && res.data.code != 0 && res.data.msg) {
        wx.showToast({
           title: res.data.msg,
       })
      }
    }
  })
}


/**
* 从一个数组中随机取出若干个元素组成数组
* @param {Array} arr 原数组
* @param {Number} count 需要随机取得个数
**/
const getRandomArray = (arr, count) => {
  var shuffled = arr.slice(0),
    i = arr.length,
    min = i - count,
    temp,
    index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

/**
* 从一个数组中随机取出一个元素
* @param {Array} arr 原数组
**/
const getRandomArrayElement = arr => {
  return arr[Math.floor(Math.random() * arr.length)];
}
/**
   * 获取汉字的拼音首字母
 */
const getFirstLetter = function(name) {
  name = name.trim();
  var str = name.substring(0, 1);
  dict.firstletter = pinyin.pinyin_dict_firstletter;
  if (!str || /^ +$/g.test(str)) return '';
  if (dict.firstletter) // 使用首字母字典文件
  {
    var result = [];
    for (var i = 0; i < str.length; i++) {
      var unicode = str.charCodeAt(i);
      var ch = str.charAt(i);
      if (unicode >= 19968 && unicode <= 40869) {
        ch = dict.firstletter.all.charAt(unicode - 19968);
      }
      result.push(ch);
    }
    var letter = result.join('').toUpperCase();
    var p = /[A-Z]/i; 
    var isWord = p.test(letter); 
    if (isWord) return letter;
    return "#";
  }
}

// 显示对话框
const showSelectList = function (obj) {
  // 显示遮罩层
  var animation = wx.createAnimation({
    duration: 200,
    timingFunction: "linear",
    delay: 0
  })
  obj.animation = animation
  animation.translateY(300).step()
  obj.setData({
    animationData: animation.export(),
    showSelect: true
  })
  setTimeout(function () {
    animation.translateY(0).step()
    obj.setData({
      animationData: animation.export()
    })
  }.bind(obj), 200)
}
//隐藏对话框
const hideSelectList = function (obj) {
  // 隐藏遮罩层
  var animation = wx.createAnimation({
    duration: 200,
    timingFunction: "linear",
    delay: 0
  })
  obj.animation = animation
  animation.translateY(300).step()
  obj.setData({
    animationData: animation.export(),
  })
  setTimeout(function () {
    animation.translateY(0).step()
    obj.setData({
      animationData: animation.export(),
      showSelect: false
    })
  }.bind(obj), 200)
}

module.exports = {
  formatDate: formatDate,
  formatTime: formatTime,
  getPreDate: getPreDate,
  httpP: httpP,
  httpG: httpG,
  getUserName: getUserName,
  formatNumber: formatNumber,
  numSub: numSub,
  getRandomArray: getRandomArray,
  getRandomArrayElement: getRandomArrayElement,
  getFirstLetter: getFirstLetter,
  showSelectList: showSelectList,
  hideSelectList: hideSelectList
}
