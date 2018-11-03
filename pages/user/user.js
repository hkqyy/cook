Page({
  /**
   * 页面的初始数据
   */
  data: {
      userInfo: {},//用户信息
      login: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    // 查看是否授权
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: function (res) {
              that.setData({
                userInfo: res.userInfo,
              });
            }
          })
        } else {
          that.setData({
            login: false,
          });
        }
      }
    })
  },
  setting: function() {
    wx.openSetting({
      success: (res) => {
        /*
         * res.authSetting = {
         *   "scope.userInfo": true,
         *   "scope.userLocation": true
         * }
         */
      }
    })
  },
  bindGetUserInfo(e) {
    if (e.detail.userInfo != undefined) {
      this.setData({
        userInfo: e.detail.userInfo,
        login: true
      });
    }
  },
  clearAllCache: function () {
    wx.showLoading({
      title: '缓存清除中',
    })
    wx.clearStorage({
      success: function (res) {
        wx.hideLoading();
        wx.showToast({
          title: '清除成功',
          icon: 'success',
          duration: 1000
        })
      },
      fail: function (res) {
        wx.hideLoading();
      }
    })
  }
    
})