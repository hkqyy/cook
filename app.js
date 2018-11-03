import { DataListTemp } from './component/dataList/dataList';

App({
  DataListTemp,
	// 初次加载会执行，再次进入不一定会执行
  onLaunch: function () {
    var that = this;
    wx.cloud.init({
      env: 'test-8bacc9'
    });
    var testDB = wx.cloud.database({
      env: 'test-8bacc9'
    })
    that.globalData.testDB = testDB;
    that.globalData.command = testDB.command;
  },
  	// 第次进入都会执行
  onShow:function(){
    
  },
  //注册
  register: function () {
    var that = this;
    // Do something initial when launch.
    //当程序开启时，自动完成注册功能 
    wx.login({
      success: function (res) {
        if (res.code) {

          //发起网络请求,注册用户
          wx.request({
            url: that.globalData.wxUrl + 'user',
            data: {
              code: res.code
            },
            success: function (res) {
              try {
                wx.setStorageSync('username', res.data.data)
              } catch (e) {
                wx.showToast({
                  title: 'setStorageSync fail',
                  duration: 10000
                })
              }
            }, fail: function () {
              console.log('login-errro');
            }
          })
        } else {
          wx.showToast({
            title: '获取用户登录态失败！',
            duration: 10000
          })
        }
      }
    });
  },
  //取设置
  getAbout: function () {
    var that = this
    wx.request({
      url: that.globalData.wxUrl + 'setting/get_set',
      data: {

      },
      success: function (res) {
        wx.setStorage({
          key: 'setting',
          data: res.data.data,
        })
      }
    })

  },
  //隐藏时清除缓存数据,用户名不清
  onHide: function () {
    // this.clearCacheData("amountSum");
  },
  globalData: {
    wxUrl: 'https://api.weixin.qq.com',
    imgUrl: '',
    testDB:'',
    openid:'',
    command: ''
  },
  getCollection: function(name) {
    return this.globalData.testDB.collection(name);
  },
  setCacheData: function(key, value) {
    wx.setStorage({
      key: key,
      data: value
    })
  },
  getCacheData: function (key) {
    try {
      var value = wx.getStorageSync(key)
      if (value) {
        return value;
      } else {
        return null;
      }
    } catch (e) {
      console.error();
    }
  },
  clearCacheData: function(key) {
    wx.removeStorage({
      key: key,
      success: function (res) { },
    })
  }
})