var common = require("../../utils/util.js");
const app = getApp();
const orderCollection = app.getCollection("order");
const pageSize = 20;
var scroll = true;

Page({
  data: {
    startDate: common.getPreDate(new Date()),
    endDate: common.formatDate(new Date()),
    searchText: '',
    sortindex: 0,  //排序索引
    sortid: 0,  //排序id
    sort: [],
    orderList: [], //订单列表
    scrolltop: null, //滚动位置
    page: 0,  //分页
    showModal: false,
    totalCnt: 0,
    display: 'none',
    orderId: '',
    oldActualAmount: 0,
    actualAmount: 0,
    orderAmount: 0,
    index: 0
  },
  onLoad: function () { //加载数据渲染页面
  },
  onShow: function() {
    // show方法每次都会执行，如果放在onLoad中数据更新后不会刷新
    this.setData({
      orderList: []
      // oldActualAmount:0,
      // actualAmount: 0,
      // orderAmount: 0
    });
    this.getOrderData(0);
    this.fetchSortData();
    this.setTotalCount();
  },
  fetchSortData: function () { //获取筛选条件
    this.setData({
      "sort": [
        {
          "id": 0,
          "title": "全部订单"
        },
        {
          "id": 1,
          "title": "待收款"
        },
        {
          "id": 2,
          "title": "已完成"
        },
      ]
    })
  },
  getOrderData: function (page, where) {  //获取订单列表数据
    var that = this;
    if (where == undefined) {
      where = {};
    }
    orderCollection.skip(page * pageSize).limit(pageSize).where(where).orderBy('date', 'desc').get()
      .then(res => {
        that.setData({
          orderList: this.data.orderList.concat(res.data)
        })
        wx.hideLoading();
        scroll = true;
      })
      .catch(console.error)
  },
  setSortBy: function (e) { //选择排序方式
    var data = this.data;
    var dataset = e.currentTarget.dataset;
    var id = dataset.sortid;
    if (id == this.data.sortid) return;
    wx.showLoading({
      title: '数据加载中',
    })
    this.setData({
      orderList: [],
      sortindex: dataset.sortindex,
      sortid: id,
      display: 'none'
    })
    var where = {};
    if(id != 0) 
      where.status = id;
    this.getOrderData(0, where);
    this.setTotalCount(where);
  },
  setStatusClass: function (e) { //设置状态颜色
    console.log(e);
  },
  scrollHandle: function (e) { //滚动事件
    this.setData({
      scrolltop: e.detail.scrollTop
    })
  },
  goToTop: function () { //回到顶部
    this.setData({
      scrolltop: 0
    })
  },
  scrollLoading: function () { //滚动加载
    if(scroll == true) {
      scroll = false;
      if (this.data.orderList.length >= this.data.totalCnt) {
        this.setData({
          display: 'block'
        })
        // scroll = true;
        return;
      }
      wx.showLoading({
        title: '数据加载中',
      })
      var where = {};
      if (this.data.sortid != 0)
        where.status = this.data.sortid;
      this.setData({
        page: this.data.page + 1,
      })
      this.getOrderData(this.data.page, where);
    }
  },
  onPullDownRefresh: function () { //下拉刷新
    this.setData({
      page: 0,
      orderList: []
    })
    this.getOrderData(0);
    this.fetchSortData();
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },
  amount: function (e) {
    var orderId = e.target.dataset.id;
    var oldActualAmount = e.target.dataset.actualamount;
    var orderAmount = e.target.dataset.orderamount;
    this.setData({
      showModal: true,
      orderId: orderId,
      oldActualAmount: oldActualAmount,
      orderAmount: orderAmount,
      index: e.target.dataset.index
    });
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
    wx.showToast({
      title: '收款成功',
      icon: 'success',
      duration: 1000
    })
    var that = this;
    var status = 1;
    var actualAmount = Number(that.data.actualAmount);
    if (actualAmount >= Number(this.data.orderAmount)) status = 2;
    orderCollection.doc(this.data.orderId).update({
      data: {
        actualAmount: actualAmount,
        status: status
      }
    })
    .then(res => {
      this.hideModal();
      var index = that.data.index;
      var order = that.data.orderList[index];
      order.actualAmount = actualAmount;
      if (status == 2) {
        that.setData({
          orderList: []
        });
        that.getOrderData(0);
      } else {
        that.setData({
          ["orderList[" + index + "]"]: order
        })
      }
     
      // 设置缓存
      var amountSum = app.getCacheData("amountSum");
      if (amountSum != null) {
        var actualAmtChange = Number(that.data.actualAmount) - Number(that.data.oldActualAmount);
        amountSum.orderAmountSum = Number(amountSum.orderAmountSum) - actualAmtChange;
        amountSum.actualAmountSum = Number(amountSum.actualAmountSum) + actualAmtChange;
        app.setCacheData("amountSum", amountSum);
      }
    })
    .catch(console.error);
  },
  edit: function(e) {
    var item = e.target.dataset.val;
    var data = JSON.stringify(item);
    wx.navigateTo({
      url: '../orderAdd/orderAdd?item=' + data 
    })
  },
  inputChange: function (e) {
    var inputName = e.target.dataset.name;
    var data = {};
    data[inputName] = e.detail.value;
    this.setData(data);
  },
  search: function() {
    var that = this;
    wx.showLoading({
      title: '数据加载中',
    })
    this.setData({
      orderList: []
    })
    const _ = app.globalData.command;
    var where = '';
    if (this.data.sortid != 0) {
      where = _.or([
        {
          name: _.eq(that.data.searchText)
        },
        {
          phone: _.eq(that.data.searchText)
        }
      ]).and([
        {
          status: _.eq(this.data.sortid)
        }
      ]);
    } else {
      where = _.or([
        {
          name: _.eq(that.data.searchText)
        },
        {
          phone: _.eq(that.data.searchText)
        }
      ]);
    }
    if (that.data.searchText == '') {
      this.getOrderData(0);
    } else {
      this.getOrderData(0, where);
    }
  },
  setTotalCount: function(where) {
    var that = this;
    if(where == undefined) {
      where = {};
    }
    orderCollection.where(where).count().then(res => {
      that.setData({
        TotalCnt: res.total
      });
    })  
  }
})