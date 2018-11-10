const common = require('../../utils/util.js');
let app = getApp();
const testDB = app.globalData.testDB;
const menuCollection = testDB.collection('menu');
var submit = true;

Page({
  data: {
    _id: '',
    name:'',
    price: '',
    unit: '',
    showModasl: false,
    action: 'formSubmit',
    //数据库存放的源数据格式
    sourceList:[],
    searchText: '',
    item: {
      searchMethod: 'search',
      addMethod: 'addMenu',
      clickMethod: 'selectMenu',
      delMethod: 'delItem',
      // 转成列表展示所需格式
      dataList: [],
      // rowList:列表要显示哪些内容
      // name:显示数据名称, property：该名称对应的数据库字段
      rowList: [
        [{ 'name': '名称: ', 'property': 'name' }],
        [{ 'name': '单位: ', 'property': 'unit' }, { 'name': '价格: ', 'property': 'price' }]
      ],
    }

  },
  onLoad: function (options) {
    // 初始化数据列表模版对象
    new app.DataListTemp();
  },
  onShow: function() {
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
      wx.showLoading({
        title: '数据保存中',
      })
      var that = this;
      var name = e.detail.value.name;
      if (name == '') {
        submit = true;
        wx.showToast({
          title: '名称不能为空',
          icon: 'none',
          duration: 1000
        })
        return;
      }
      var unit = e.detail.value.unit;
      var price = e.detail.value.price;
      var letter = common.getFirstLetter(name);
      // 保存
      menuCollection.add({
        // data 字段表示需新增的 JSON 数据
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
          wx.hideLoading();
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
  selectMenu: function (e) {
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
      var ietm = e.currentTarget.dataset.val;
      this.setData({
        showModal: true,
        action: 'edit',
        _id: ietm._id,
        name: ietm.name,
        unit: ietm.unit,
        price: ietm.price
      })
    }

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
            },
            fail: function (res) {
              wx.showToast({
                title: '基础数据不能删除',
                icon: 'none',
                duration: 1000
              })
            }
          })
        }
      }  
    })
  },
  //修改
  edit: function (e) {
    if (submit) {
      submit = false;
      wx.showLoading({
        title: '数据保存中',
      })
      var that = this;
      var _id = e.detail.value._id;
      var name = e.detail.value.name;
      if (name == '') {
        submit = true;
        wx.showToast({
          title: '名称不能为空',
          icon: 'none',
          duration: 1000
        })
        return;
      }
      var unit = e.detail.value.unit;
      var price = e.detail.value.price;
      var letter = common.getFirstLetter(name);
      var sourceList = this.data.sourceList;
      menuCollection.doc(_id).update({
        // data 字段表示需新增的 JSON 数据
        data: {
          name: name,
          price: price,
          unit: unit,
          letter: letter
        },
        success: function (res) {
          for (var i = 0; i < sourceList.length; i++) {
            if (sourceList[i]._id == _id) {
              var item = sourceList[i];
              item.name = name;
              item.price = price;
              item.unit = unit;
              item.letter = letter;
              item.display = 'none';
              that.setData({
                ["sourceList[" + i + "]"]: item
              });
              break;
            }
          }
          var dataList = that.formatList(sourceList);
          that.setData({
            'item.dataList': dataList
          });
          wx.hideLoading();
          wx.showToast({
            title: '修改成功',
            icon: 'success',
            duration: 1000
          })
          that.hideModal();
          app.setCacheData("menuList", sourceList);
          submit = true;
        },
        fail: function (res) {
          wx.showToast({
            title: '修改失败',
            icon: 'success',
            duration: 1000
          })
          submit = true;
        }
      });
    }
  },
  getData: function (where) {
    var that = this;
    if(where == undefined) where = {};
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
        var dataList = this.formatList(sourceList);
        this.setData({
          sourceList: sourceList,
          'item.dataList': dataList
        })
        wx.hideLoading();
      } else {
        this.getData();
      }
    }
  }
})