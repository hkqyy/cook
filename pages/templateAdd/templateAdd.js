const common = require('../../utils/util.js');
// 调用应用实例的方法获取全局数据
let app = getApp();
const templateCollection = app.getCollection('template');
const detailCollection = app.getCollection('templateDetail');
var submit = true;

Page({
	/**
	 * 页面的初始数据
	 */
  data: {
    templateId: '',
    name: '',
    remark: '',
    index: '',
    oldLetter: '',
    listData: [],
  },

	/**
	 * 生命周期函数--监听页面加载
	 */
  onLoad: function (options) {
    if (options.templateId != undefined) {
      var templateId = options.templateId;
      var where = { templateId: templateId};
      var that = this;
      wx.cloud.callFunction({
        // 云函数名称
        name: 'getAllData',
        data: {
          name: "templateDetail",
          where: where,
        }
      }).then(res => {
        var dataList = res.result.data;
        that.setData({
          listData: dataList,
          templateId: templateId,
          index: options.index,
          oldLetter: options.letter
        })
      }).catch(console.error)
    }

    if (options.name != undefined) {
      this.setData({
        name: options.name
      })
    }
    if (options.remark != undefined && options.remark != 'undefined') {
      this.setData({
        remark: options.remark
      })
    }
  },
  nameChange:function (e) {
    this.setData({
      name: e.detail.value
    });
  },
  remarkChange: function (e) {
    this.setData({
      remark: e.detail.value
    });
  },
  delete: function (e) {
    var that = this;
    wx.showModal({
      title: '提示',
      content: '是否确定删除?',
      success: function(res) {
        if(res.confirm) {
          var arr = that.data.listData;
          var index = e.currentTarget.dataset.index;
          arr.splice(index,1);
          that.setData({
            listData: that.data.listData
          });
        }
      }
    }) 
  },
  priceChange: function (e) {
    var list = this.data.listData;
    var item = list[e.target.dataset.id];
    item.price = e.detail.value;
  },
  cntChange: function (e) {
    var list = this.data.listData;
    var item = list[e.target.dataset.id];
    item.count = e.detail.value;
  },
  submit: function () {
    if (submit) {
      submit = false;
      var name = this.data.name;
      var remark = this.data.remark;
      var letter = common.getFirstLetter(name);
      // 保存
      wx.showLoading({
        title: '数据保存中',
      })
      if(this.data.templateId != '') {
        this.update(this.data.templateId, name, remark, letter);
      } else {
        this.add(name, remark, letter);
      }
      
    }
  },
  setList: function(name, dataList) {
    var letter = common.getFirstLetter(name);

    var menu = {};
    menu.name = name;
    menu.display = "none";
    var isNew = true;
    for (var i = 0; i < dataList.length; i++) {
      var item = dataList[i];
      if (item.letter == letter) {
        item.data.push(menu);
        isNew = false;
        break;
      }
    }
    // 如果新增的菜式没有存在的首字母拼音
    if (isNew) {
      var newItem = {};
      newItem.letter = letter;
      var arr = [];
      arr.push(menu);
      newItem.data = arr;
      dataList.push(newItem);
    }
  },
  log: function(data) {
    console.log(data);
  },
  add: function(name, remark, letter) {
    var that = this;
    templateCollection.add({
      data: {
        name: name,
        remark: remark,
        letter: letter
      },
      success: function (res) {
        var template = {};
        template._id = res._id;
        template.name = name;
        template.remark = remark;
        template.letter = letter;
        template.display = 'none';

        var pages = getCurrentPages();
        var currPage = pages[pages.length - 1];  //当前页面
        var prevPage = pages[pages.length - 2]; //上一个编辑款项页面
        var sourceList = prevPage.data.sourceList;
        sourceList.push(template);
        var dataList = prevPage.formatList(sourceList);
        prevPage.setData({
          sourceList: sourceList,
          'item.dataList': dataList
        });
        app.setCacheData("templateList", sourceList);

        wx.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 500
        })
        submit = true;
        wx.hideLoading();
        setTimeout(function() {
          wx.navigateBack();
        }, 500); 
        var detailList = that.data.listData;
        for (var i in detailList) {
          var item = detailList[i];
          detailCollection.add({
            // data 字段表示需新增的 JSON 数据
            data: {
              templateId: res._id,
              name: item.name,
              unit: item.unit,
              price: item.price,
              count: item.count
            }
          })
            .then(res => {

            })
        }
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
  },
  update: function (templateId, name, remark, letter) {
    var that = this;
    // 更新模版
    templateCollection.doc(templateId).update({
      data: {
        name: name,
        remark: remark,
        letter: letter
      },
      success: function (res) {
        var pages = getCurrentPages();
        var currPage = pages[pages.length - 1];  //当前页面
        var prevPage = pages[pages.length - 2]; //上一个页面
        var sourceList = prevPage.data.sourceList;

        if (that.data.oldLetter == letter) {
          for (var i in sourceList) {
            if (sourceList[i]._id == templateId) {
              sourceList[i].name = name;
              sourceList[i].remark = remark;
              prevPage.setData({
                ["sourceList[" + i + "]"]: sourceList[i]
              });
              break;
            }
          }
          var dataList = prevPage.formatList(sourceList);
          prevPage.setData({
            'item.dataList': dataList
          });
        } else {
          for (var i in sourceList) {
            if (sourceList[i]._id == templateId) {
              sourceList.splice(i, 1);
              break;
            }
          }  
          var template = {};
          template._id = templateId;
          template.name = name;
          template.remark = remark;
          template.letter = letter;
          template.display = 'none';
          sourceList.push(template);
          var dataList = prevPage.formatList(sourceList);
          prevPage.setData({
            sourceList: sourceList,
            'item.dataList': dataList
          });
        }
        app.setCacheData("templateList", sourceList);

        wx.showToast({
          title: '更新成功',
          icon: 'success',
          duration: 500
        })
        submit = true;
        wx.hideLoading();
        setTimeout(function () {
          wx.navigateBack();
        }, 500);

        // 删除明细
        var where = { templateId: templateId };
        wx.cloud.callFunction({
          // 云函数名称
          name: 'deleteAllData',
          data: {
            name: "templateDetail",
            where: where
          }
        }).then(res => {
          //更新明细的数据
          var detailList = that.data.listData;
          for (var i in detailList) {
            var item = detailList[i];
            detailCollection.add({
              // data 字段表示需新增的 JSON 数据
              data: {
                templateId: templateId,
                name: item.name,
                unit: item.unit,
                price: item.price,
                count: item.count
              }
            })
              .then(res => {

              })
          }
        })
          .catch(console.error)

      },
      fail: function (res) {

        wx.showToast({
          title: '更新失败',
          icon: 'none',
          duration: 1000
        })
        submit = true;
      }
    });
  },
  addMenu: function() {
    wx.navigateTo({
      url: '../menuList/menuList?from=addTemplate'
    })
  }
})