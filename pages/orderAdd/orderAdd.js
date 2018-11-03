// pages/newAdd/newAdd.js
var common = require("../../utils/util.js");
var app = getApp();

Page({

	/**
	 * 页面的初始数据
	 */
  data: {
    oldActualAmount: 0,
    oldOrderAmount: 0,
    orderAmount: 0,
    actualAmount: 0,
    orderId: '',
    date: '',
    name: '',
    phone: '',
    person: '',
    address: '', //地址
    remark: '',
    showModal: false,
    listData: [],
    action: 'submitOrder',
    status: 1,
    item: ''
  },

	/**
	 * 生命周期函数--监听页面加载
	 */
  onLoad: function (options) {
    if (options.item != undefined) {
      wx.showLoading({
        title: '数据加载中',
      })
      var item = JSON.parse(options.item);
      this.setData({
        orderId: item._id,
        date: item.date,
        name: item.name,
        phone: item.phone,
        person: item.person,
        address: item.address,
        remark: item.remark,
        actualAmount: item.actualAmount,
        orderAmount: item.orderAmount,
        oldActualAmount: item.actualAmount,
        oldOrderAmount: item.orderAmount,
        status: item.status,
        item: item
      });
      var where = { orderId: item._id };
      var that = this;
      wx.cloud.callFunction({
        // 云函数名称
        name: 'getAllData',
        data: {
          name: "orderDetail",
          where: where,
        }
      }).then(res => {
        var dataList = res.result.data;
        var orderSum = 0;
        for (var i in dataList) {
          orderSum += Number(dataList[i].sum);
        }
        this.setData({
          listData: dataList,
          orderAmount: orderSum
        })
        wx.hideLoading();
      }).catch(console.error)
    } else {
      this.setData({
        date: common.formatDate(new Date())
      });
    }

  },
  chooseAddr: function () {
    var that = this;
    wx.chooseLocation({
      success: function (res) {
        that.setData({
          address: res.address
        });

      },
    })
  },

  //提交订单
  submitOrder: function () {
    if(this.data.orderId != '') {
      this.update();
    } else {
      this.add();
    }
  },
	/**
	 * 用户点击右上角分享
	 */
  onShareAppMessage: function () {
    var item = this.data.item;
    if (item == '') {
      return;
    }
    item.status = 2;
    var data = JSON.stringify(item);
    return {
      title: '菜单明细',
      desc: '菜单明细',
      path: '/pages/orderAdd/orderAdd?item=' + data
    }
  },
  priceChange: function (e) {
    var list = this.data.listData;
    var item = list[e.target.dataset.id];
    item.price = e.detail.value;
    var oldSum = item.sum;
    item.sum = (item.price * item.count).toFixed(2);
    var orderAmount = (Number(this.data.orderAmount) + Number(item.sum) - Number(oldSum)).toFixed(2);
    this.setData({
      ["listData[" + e.target.dataset.id + "]"]: item,
      orderAmount: orderAmount
    });
  },
  cntChange: function (e) {
    var list = this.data.listData;
    var item = list[e.target.dataset.id];
    item.count = e.detail.value;
    var oldSum = item.sum;
    item.sum = (item.price * item.count).toFixed(2);
    var orderAmount = (Number(this.data.orderAmount) + Number(item.sum) - Number(oldSum)).toFixed(2);
    this.setData({
      ["listData[" + e.target.dataset.id + "]"]: item,
      orderAmount: orderAmount
    });
  },
  bindTimeChange: function (e) {
    //设置事件
    this.setData({
      //给当前time进行赋值
      date: e.detail.value
    })
  },
  submitDialog: function () {
    this.setData({
      showModal: true
    });
  },
  /**   * 隐藏模态对话框   */
  hideModal: function () {
    this.setData({
      showModal: false
    });
  },
  /**   * 对话框取消按钮点击事件   */
  onCancel: function () {
    this.hideModal();
  },
  onConfirm: function () {
    this.hideModal();
  },
  delete: function (e) {
    var that = this;
    wx.showModal({
      title: '提示',
      content: '是否确定删除?',
      success: function (res) {
        if (res.confirm) {
          var list = that.data.listData;
          var index = e.currentTarget.dataset.index;
          var sum = list[index].sum;
          var orderAmount = Number((that.data.orderAmount - sum).toFixed(2));
          list.splice(index, 1);
          that.setData({
            listData: list,
            orderAmount: orderAmount
          });
        }
      }
    })
  },
  addMenu: function (e) {
    wx.navigateTo({
      url: '../menuList/menuList',
    })
  },
  inputChange: function (e) {
    var inputName = e.target.dataset.name;
    var data = {};
    if (inputName == 'actualAmount') {
      data[inputName] = Number(e.detail.value);
    } else {
      data[inputName] = e.detail.value;
    }
    
    this.setData(data);
  },
  add: function () {
    var that = this;
    // 保存订单
    var order = {};
    order.date = this.data.date;
    order.name = this.data.name;
    order.phone = this.data.phone;
    order.person = this.data.person;
    order.address = this.data.address;
    order.remark = this.data.remark;
    order.orderAmount = this.data.orderAmount;
    // if (this.data.actualAmount == '') {
    //   order.actualAmount = 0;
    // } else {
    //   order.actualAmount = this.data.actualAmount;
    // }
    order.actualAmount = this.data.actualAmount;
    // 1待付款 2已完成
    if (order.actualAmount < order.orderAmount || order.orderAmount == 0) {
      order.status = 1;
    } else {
      order.status = 2;
    }
    var orderCollection = app.getCollection("order");
    orderCollection.add({
      data: order
    })
      .then(res => {
        var orderId = res._id;
        var menuList = that.data.listData;
        var orderDetailList = [];
        for (var i in menuList) {
          var orderDetail = {};
          var item = menuList[i];
          orderDetail.orderId = orderId;
          orderDetail.name = item.name;
          orderDetail.unit = item.unit;
          orderDetail.price = item.price;
          orderDetail.count = item.count;
          orderDetail.sum = item.sum;
          orderDetailList.push(orderDetail);
        }
        // 保存订单明细
        var detailCollection = app.getCollection("orderDetail");
        for (var i in orderDetailList) {
          detailCollection.add({
            data: orderDetailList[i]
          }).then(res => {

          }).catch(console.error);
        }

        // 返回首页
        wx.showToast({
          title: '开单成功',
          icon: 'success',
          duration: 1000
        })
        setTimeout(function() {
          wx.switchTab({
            url: '../order/order'
          })
        }, 1000);
        var amountSum = app.getCacheData("amountSum");
        if (amountSum != null) {
          amountSum.orderAmountSum = Number(amountSum.orderAmountSum) + Number(order.orderAmount);
          amountSum.actualAmountSum = Number(amountSum.actualAmountSum) + Number(order.actualAmount);
          app.setCacheData("amountSum", amountSum);
        }
      }).catch(console.error)
  },
  update: function () {
    var that = this;
    // 保存订单
    var order = {};
    order.date = this.data.date;
    order.name = this.data.name;
    order.phone = this.data.phone;
    order.person = this.data.person;
    order.address = this.data.address;
    order.remark = this.data.remark;
    order.orderAmount = this.data.orderAmount;
    order.actualAmount = this.data.actualAmount;
    // 1待付款 2已完成
    if (order.actualAmount < order.orderAmount || order.orderAmount == 0) {
      order.status = 1;
    } else {
      order.status = 2;
    }
    var orderCollection = app.getCollection("order");
    orderCollection.doc(this.data.orderId).update({
      data: order
    })
      .then(res => {
        var orderId = that.data.orderId;
        // 删除明细
        var where = { orderId: orderId };
        wx.cloud.callFunction({
          // 云函数名称
          name: 'deleteAllData',
          data: {
            name: "orderDetail",
            where: where
          }
        }).then(res => {
           // 保存订明细
          var menuList = that.data.listData;
          var orderDetailList = [];
          for (var i in menuList) {
            var orderDetail = {};
            var item = menuList[i];
            orderDetail.orderId = orderId;
            orderDetail.name = item.name;
            orderDetail.unit = item.unit;
            orderDetail.price = item.price;
            orderDetail.count = item.count;
            orderDetail.sum = item.sum;
            orderDetailList.push(orderDetail);
          }
          var detailCollection = app.getCollection("orderDetail");
          for (var i in orderDetailList) {
            detailCollection.add({
              data: orderDetailList[i]
            }).then(res => {

            }).catch(console.error);
          }
        })
          .catch(console.error)
      
        // 返回首页
        wx.showToast({
          title: '更新成功',
          icon: 'success',
          duration: 1000
        })
        setTimeout(function () {
          wx.switchTab({
            url: '../order/order'
          })
        }, 1000);
        // 设置缓存
        var amountSum = app.getCacheData("amountSum");
        if (amountSum != null) {
          var orderAmtChange = Number(order.orderAmount) - Number(that.data.oldOrderAmount);
          var actualAmtChange = Number(order.actualAmount) - that.data.oldActualAmount;
          amountSum.orderAmountSum = Number(amountSum.orderAmountSum) + orderAmtChange - actualAmtChange;
          amountSum.actualAmountSum = Number(amountSum.actualAmountSum) + actualAmtChange;
          app.setCacheData("amountSum", amountSum);
        }
      }).catch(console.error)
  },
  /**   * 隐藏模态对话框   */
  hideModal: function (e) {
    this.setData({
      showModal: false
    });
  },
  /**   * 对话框取消按钮点击事件   */
  onCancel: function () {
    this.hideModal();
  },
  onConfirm: function () {
    this.submitOrder();
  },
  showModal: function (e) {
    this.setData({
      showModal: true
    });
  },
  choosePerson: function() {
    wx.navigateTo({
      url: '../person/person?from=orderAdd&date='+ this.data.date,
    })
  }
})