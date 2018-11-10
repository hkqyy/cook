const common = require('../../utils/util.js');
//获取应用实例
const app = getApp();

Page({
  data: {
    indexmenu: [],
    imgUrls: [],
    orderAmountSum: 0,
    actualAmountSum: 0
  },
  onLoad: function () {
  },
  onShow: function() {
    this.init();
  },
  fetchData: function () {
    this.setData({
      indexmenu: [
        {
          'icon': './../../images/icon_13.png',
          'text': '开单',
          'url': 'orderAdd'
        },
        {
          'icon': './../../images/icon_07.png',
          'text': '模板管理',
          'url': 'template'
        },
        {
          'icon': './../../images/icon_05.png',
          'text': '人员管理',
          'url': 'person'
        }

      ],
      imgUrls: [
        '../../images/index1.jpg',
        '../../images/index2.jpg'
      ]
    })
  },
  changeRoute: function (url) {
    wx.navigateTo({
      url: `../${url}/${url}`
    })
  },
  onPullDownRefresh() {
    // this.getAdvs();
    // this.getDecorate();
    // wx.stopPullDownRefresh();
  },
  init: function() {
    this.fetchData();
    var that = this;
    var amountSum = app.getCacheData("amountSum");
    if (amountSum != null) {
      this.setData({
        orderAmountSum: amountSum.orderAmountSum,
        actualAmountSum: amountSum.actualAmountSum
      })
    } else {
      wx.cloud.init({
        env: 'test-8bacc9'
      });
      wx.cloud.callFunction({
        // 云函数名称
        name: 'getAllData',
        data: {
          name: "order"
        },
        success: function (res) {
          var orderAmountSum = 0;
          var actualAmountSum = 0;
          var dataList = res.result.data;

          for (var i in dataList) {
            var order = dataList[i];
            if (order.status == 1) {
              orderAmountSum = orderAmountSum + Number(order.orderAmount) - Number(order.actualAmount);
            }
            actualAmountSum = actualAmountSum + Number(order.actualAmount);
          }
          that.setData({
            orderAmountSum: orderAmountSum.toFixed(2),
            actualAmountSum: actualAmountSum.toFixed(2)
          })
          app.setCacheData(
            "amountSum", { orderAmountSum: orderAmountSum.toFixed(2), actualAmountSum: actualAmountSum.toFixed(2) }
          );
        },
        fail: console.error
      })
      
    }
  }

})
