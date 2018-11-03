const common = require('../../utils/util.js');
let app = getApp();
const testDB = app.globalData.testDB;
const collection = testDB.collection('person');
var submit = true;

Page({
  data: {
    _id: '',
    name: '',
    phone: '',
    searchText: '',
    sourceList: [],
    action: 'formSubmit',
    showModasl: false,
    showSelect: false,
    from: '',
    orderDate: '',
    // 该开单日期已有订单的人员
    orderPersonList:[], 
    //点击数据后存放对象List
    selectObjList: [],
    item: {
      searchMethod: 'search',
      addMethod: 'add',
      clickMethod: 'selectItem',
      delMethod: 'delItem',
      dataList: [],
      rowList: [[{ 'name': '姓名: ', 'property': 'name' }], [{ 'name': '手机: ', 'property': 'phone' }]],
    }
  },

  onLoad: function(options) {
    new app.DataListTemp();
    var that = this;

    if (options.from != undefined) {
      this.setData({
        from: options.from,
        orderDate: options.date
      })
      this.getOrderPerson(options.date);
    } else {
      var personList = app.getCacheData("personList");
      if (personList != null) {
        var dataList = this.formatList(personList, that.data.orderPersonList);
        this.setData({
          'sourceList': personList,
          'item.dataList': dataList
        })
      } else {
        this.getData();
      }
    }

  },
  onShow: function () {
    this.setData({
      selectObjList: [],
      orderPersonList: []
    })
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
      var sourceList = app.getCacheData("personList");
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
  },
  add: function () {
    this.setData({
      showModal: true,
      action: 'formSubmit',
      _id: '',
      name: '',
      phone: ''
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
  inputChange: function (e) {
    var inputName = e.target.dataset.name;
    var data = {};
    data[inputName] = e.detail.value;
    this.setData(data);
  },
  getData: function (where) {
    var that = this;
    if (where == undefined) where = {};
    wx.cloud.callFunction({
      // 云函数名称
      name: 'getAllData',
      data: {
        name: "person",
        where: where
      },
      success: function (res) {
        var sourceList = res.result.data;
        var dataList = that.formatList(sourceList, that.data.orderPersonList);
        that.setData({
          sourceList: sourceList,
          'item.dataList': dataList
        });
        wx.hideLoading();
        if (where.name == undefined) {
          app.setCacheData("personList", sourceList);
        }
      },
      fail: function (res) {
        console.log(res);
      }
    })
  },
  formSubmit: function (e) {
    if (submit) {
      submit = false;
      var that = this;
      var name = this.data.name;
      var phone = this.data.phone;
      var letter = common.getFirstLetter(name);
      // 保存
      collection.add({
        // data 字段表示需新增的 JSON 数据
        data: {
          name: name,
          phone: phone,
          letter: letter
        },
        success: function (res) {
          var obj = {};
          obj._id = res._id;
          obj.name = name;
          obj.phone = phone;
          obj.letter = letter;
          obj.display = 'none';
          var sourceList = that.data.sourceList;
          sourceList.push(obj);
          var dataList = that.formatList(sourceList);
          console.log(sourceList);
          that.setData({
            sourceList: sourceList,
            'item.dataList': dataList
          });

          wx.showToast({
            title: '添加成功',
            icon: 'success',
            duration: 1000
          })
          app.setCacheData("personList", sourceList);
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
  selectItem: function (e) {
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
      var from = this.data.from;
      var pages = getCurrentPages();
      var currPage = pages[pages.length - 1];  //当前页面
      var prevPage = pages[pages.length - 2]; //上一个编辑款项页面
      if (from == 'orderAdd') {
        var val = e.currentTarget.dataset.val;
        if (val.select == 'S') {
          var title = val.name + '在' + this.data.orderDate + '已有订单请选择其他人';
          wx.showToast({
            title: title,
            icon: 'none',
            duration: 1500
          })
        } else {
          var list = this.data.selectObjList;
          for (var i in list) {
            if (val.name == list[i]) {
              wx.showToast({
                title: val.name + '已被选择，请选择其他人',
                icon: 'none',
                duration: 1500
              })
              return;
            }
          }
          list.push(val.name);
          this.setData({
            selectObjList: list
          })
          wx.showToast({
            title: '添加成功',
            icon: 'none',
            duration: 700
          })
        }
      } else {
        var ietm = e.currentTarget.dataset.val;
        this.setData({
          showModal: true,
          action: 'edit',
          _id: ietm._id,
          name: ietm.name,
          phone: ietm.phone
        })
      }

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
          collection.doc(_id).remove({
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
              app.setCacheData("personList", sourceList);
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
      var that = this;
      var _id = this.data.name._id;
      var name = this.data.name;
      var phone = this.data.phone;
      var letter = common.getFirstLetter(name);
      var sourceList = this.data.sourceList;
      collection.doc(_id).update({
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
              item.phone = phone;
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
          wx.showToast({
            title: '修改成功',
            icon: 'success',
            duration: 1000
          })
          that.hideModal();
          app.setCacheData("personList", sourceList);
          submit = true;
        },
        fail: function (res) {
          wx.showToast({
            title: '添加成功',
            icon: 'none',
            duration: 1000
          })
          submit = true;
        }
      });
    }
  },
  backToPreView: function () {
    var that = this;
    var pages = getCurrentPages();
    var currPage = pages[pages.length - 1];  //当前页面
    var prevPage = pages[pages.length - 2]; //上一个页面
    prevPage.setData({
      person: that.data.selectObjList.join(',')
    });
    setTimeout(function () {
      wx.navigateBack();
    }, 500);
  },
  // 显示对话框
  showSelectList: function () {
    common.showSelectList(this);
  },
  //隐藏对话框
  hideSelectList: function () {
    common.hideSelectList(this);
  },
  removeSelect: function (e) {
    var list = this.data.selectObjList;
    var index = e.currentTarget.dataset.index;
    list.splice(index, 1);
    this.setData({
      selectObjList: list
    });
  },
  getOrderPerson: function(date) {
    var that = this;
    var where = { date: date};
    wx.cloud.callFunction({
      // 云函数名称
      name: 'getAllData',
      data: {
        name: "order",
        where: where
      },
      success: function (res) {
        var sourceList = res.result.data;
        var orderPersonList = [];
        for (var i in sourceList) {
          var person = sourceList[i].person;
          if (person != undefined) {
            var arr = person.split(',');
            orderPersonList = orderPersonList.concat(arr);
          }
        }
        that.setData({
          orderPersonList: orderPersonList
        });
        
        var personList = app.getCacheData("personList");
        if (personList != null) {
          var dataList = that.formatList(personList, that.data.orderPersonList);
          that.setData({
            'sourceList': personList,
            'item.dataList': dataList
          })
        } else {
          that.getData();
        }
        
      },
      fail: function (res) {
        console.log(res);
      }
    })
  }
})

