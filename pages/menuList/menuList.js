const common = require('../../utils/util.js');
var submit = true;
let app = getApp();
const menuCollection = app.getCollection('menu');

Page({
  data: {
    id: '',
    name:'',
    price: '',
    unit: '',
    maskVisual: 'hidden',
    showModasl: false,
    showSelect: false,
    action: 'formSubmit',
    //选择菜单存放List
    selectObjList: [],
    //数据库存放的源数据格式
    sourceList: [],
    searchText: '',
    item: {
      searchMethod: 'search',
      addMethod: 'addMenu',
      clickMethod: 'selectMenu',
      delMethod: 'delItem',
      // 转成列表展示所需格式
      dataList: [],
      rowList: [
        [{ 'name': '名称: ', 'property': 'name' }],
        [{ 'name': '单位: ', 'property': 'unit' }, { 'name': '价格: ', 'property': 'price' }]
      ],
    }

  },

  onLoad: function (options) {
    // 初始化数据列表模版对象
    new app.DataListTemp();
    var that = this;
    var sourceList = app.getCacheData("menuList");
    if (sourceList != null) {
      var dataList = that.formatList(sourceList);
      this.setData({
        sourceList: sourceList,
        'item.dataList': dataList
      })
    } else {
      this.getData();
    }

    if (options.from != undefined) {
      this.setData({
        from: options.from
      })
    }
  },
  onShow: function () {
    this.setData({
      selectObjList: []
    })
  },
  addMenu: function () {
    this.setData({
      showModal: true,
      action: 'formSubmit',
      id: '',
      name: '',
      unit: '',
      price: '',
    })
  },
  hideModal: function () {
    this.setData({
      showModal: false
    });
  },
  onCancel: function () {
    this.hideModal();
  },
  formSubmit: function (e) {
    if (submit) {
      submit = false;
      var that = this;
      var name = e.detail.value.name;
      var unit = e.detail.value.unit;
      var price = e.detail.value.price;

      var letter = common.getFirstLetter(name);
      // 保存菜式
      menuCollection.add({
        data: {
          name: name,
          price: price,
          unit: unit,
          letter: letter
        },
        success: function (res) {
          var menu = {};
          menu._id = res._id;
          menu.name = name;
          menu.price = price;
          menu.unit = unit;
          menu.letter = letter;
          menu.display = 'none';
          var sourceList = that.data.sourceList;
          sourceList.push(menu);
          var dataList = that.formatList(sourceList);
          that.setData({
            sourceList: sourceList,
            'item.dataList': dataList
          });
          wx.showToast({
            title: '添加成功',
            icon: 'success',
            duration: 1000
          })
          app.setCacheData("menuList", sourceList);
          that.hideModal();
          submit = true;
        },
        fail: function (res) {
          wx.showToast({
            title: '添加失败',
            icon: 'none',
            duration: 1000
          })
          submit = true;
        }
      });
    }
  },
  //点击菜单
  selectMenu(e) {
    var display = e.currentTarget.dataset.display;
    if (display == 'block') {
      var index = e.currentTarget.dataset.index;
      var letter = e.currentTarget.dataset.letter;
      var list = this.data.item.dataList;

      for (var i = 0; i < list.length; i++) {
        if (list[i].letter == letter) {
          var arr = list[i].data;
          arr[index].display = "none";
          this.setData({
            ["item.dataList[" + i + "]"]: list[i]
          });
          break;
        }
      }
    } else {
      var isExist = false;
      var val = e.currentTarget.dataset.val;
      var data = { "name": val.name, "unit": val.unit, "price": val.price, "count": 1, "sum": val.price };
      var list = this.data.selectObjList;
      for (var i in list) {
        if (val.name == list[i].name) {
          list[i].count = Number(list[i].count) + 1;
          list[i].sum = Number(list[i].count) * Number(list[i].price);
          isExist = true;
          break;
        }
      } 
      if (isExist == false) {
        list.push(data);
      }
      var orderAmount = Number(this.data.orderAmount) + Number(val.price);
      this.setData({
        selectObjList: list,
        orderAmount: orderAmount
      })
      
      wx.showToast({
        title: '添加成功',
        icon: 'none',
        duration: 500
      })
    }
  },
  backToPreView: function() {
    var that = this;
    var pages = getCurrentPages();
    var currPage = pages[pages.length - 1];  //当前页面
    var prevPage = pages[pages.length - 2]; //上一个页面
    var list = prevPage.data.listData;
    var newList = that.data.selectObjList;
    var orderAmount = 0;
    for (var i in newList) {
      var isOld = false;
      var item = newList[i];
      for (var j in list) {
        if (item.name == list[j].name) {
          var oldItem = list[j];
          oldItem.count = Number(oldItem.count) + Number(item.count);
          oldItem.sum = Number(oldItem.sum) + Number(item.sum);
          isOld = true;
          break;
        }
      }

      if (isOld == false) {
        list.push(item);
      }
      orderAmount += Number(item.sum);
    }

    prevPage.setData({
      listData: list,
      orderAmount: Number(prevPage.data.orderAmount) + orderAmount
    });
    setTimeout(function () {
      wx.navigateBack();
    }, 500); 
  },
  getData: function (where) {
    var that = this;
    if (where == undefined) where = {};
    wx.cloud.callFunction({
      // 云函数名称
      name: 'getAllData',
      data: {
        name: "menu",
        where: where
      },
      success: function (res) {
        var sourceList = res.result.data;
        var dataList = that.formatList(sourceList);
        that.setData({
          sourceList: sourceList,
          'item.dataList': dataList
        });
        wx.hideLoading();
        if (where.name == undefined) {
          app.setCacheData("menuList", sourceList);
        }

      }
    })
  },
  inputChange: function (e) {
    var inputName = e.target.dataset.name;
    var data = {};
    data[inputName] = e.detail.value;
    this.setData(data);
  },
  search: function () {
    wx.showLoading({
      title: '数据读取中',
    })
    if (this.data.searchText != '') {
      var where = {};
      where.name = this.data.searchText;
      this.getData(where);
    } else {
      var sourceList = app.getCacheData("menuList");
      if (sourceList != null) {
        var dataList = this.formatList(menuList);
        this.setData({
          sourceList: sourceList,
          'item.dataList': dataList
        })
        wx.hideLoading();
      } else {
        this.getData();
      }
    }
  },
  // 显示对话框
  showSelectList: function () {
    common.showSelectList(this);
  },
  //隐藏对话框
  hideSelectList: function () {
    common.hideSelectList(this);
  },
  priceChange: function (e) {
    var list = this.data.selectObjList;
    var item = list[e.target.dataset.index];
    item.price = e.detail.value;
    var oldSum = item.sum;
    item.sum = (item.price * item.count).toFixed(2);
    this.setData({
      ["selectObjList[" + e.target.dataset.index + "]"]: item
    });
  },
  cntChange: function (e) {
    var list = this.data.selectObjList;
    var item = list[e.target.dataset.index];
    item.count = e.detail.value;
    item.sum = Number((item.price * item.count).toFixed(2));
    this.setData({
      ["selectObjList[" + e.target.dataset.index + "]"]: item
    });
  },
  removeSelect: function(e) {
    var list = this.data.selectObjList;
    var index = e.currentTarget.dataset.index;
    list.splice(index, 1);
    this.setData({
      selectObjList: list
    });
  },
  subtract: function (e) {
    var index = e.currentTarget.dataset.index;
    var list = this.data.selectObjList;
    var item = list[index];
    var count = Number(e.currentTarget.dataset.count);
    if (count == 0) return;
    item.count = count - 1; 
    item.sum = Number((item.price * item.count).toFixed(2));
    this.setData({
      ["selectObjList[" + index + "]"]: item,
    });
  },
  add: function (e) {
    var index = e.currentTarget.dataset.index;
    var list = this.data.selectObjList;
    var item = list[index];
    var count = Number(e.currentTarget.dataset.count);
    item.count = count + 1;
    item.sum = Number((item.price * item.count).toFixed(2));
    this.setData({
      ["selectObjList[" + index + "]"]: item,
    });
  },
  //点击删除按钮事件
  delItem: function (e) {
    var index = e.target.dataset.index;
    var letter = e.target.dataset.letter;
    var _id = e.target.dataset.id;
    var dataList = this.data.item.dataList;
    var sourceList = this.data.sourceList;
    var isDel = false;
    var that = this;
    wx.showModal({
      title: '提示',
      content: '是否确定删除?',
      success: function (res) {
        if (res.confirm) {
          menuCollection.doc(_id).remove({
            success: function (res) {
              for (var i = 0; i < sourceList.length; i++) {
                if (sourceList[i]._id == _id) {
                  sourceList.splice(i, 1);
                  break;
                }
              }
              for (var i = 0; i < dataList.length; i++) {
                if (dataList[i].letter == letter) {
                  var arr = dataList[i].data;
                  arr.splice(index, 1);
                  isDel = true;
                  break;
                }
              }
              //更新列表的状态
              if (isDel) {
                that.setData({
                  sourceList: sourceList,
                  'item.dataList': dataList
                });
              }
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 1000
              })
              app.setCacheData("menuList", sourceList);
            }
          })
        }
      }
    })
  },
})