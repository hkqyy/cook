let app = getApp();
const templateCollection = app.getCollection('template');
var select = true;

Page({
  data: {
    from: '',
    showModal: false,
    sourceList: [],
    searchText: '',
    item: {
      searchMethod: 'search',
      addMethod: 'addTemplate',
      clickMethod: 'selectTemp',
      delMethod: 'delItem',
      dataList: [],
      rowList: [
        [{ 'name': '', 'property': 'name' }]
      ],
    }

  },
  onLoad: function(options) {
    new app.DataListTemp();
    var that = this;
    var sourceList = app.getCacheData("templateList");
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
  addTemplate: function() {
    wx.navigateTo({
      url: '../templateAdd/templateAdd?from=addTemplate'
    })
  },
  selectTemp: function (e) {
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
        if (select == true) {
          select = false;
          wx.showLoading({
            title: '数据读取中',
          })
          var templateId = e.currentTarget.dataset.val._id;
          var where = { templateId: templateId };
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
            // 把数据返回开单页面
            var list = [];
            var orderAmount = 0;
            for (var i in dataList) {
              var item = dataList[i];
              var menu = {};
              menu.name = item.name;
              menu.price = item.price;
              menu.unit = item.unit;
              menu.count = item.count;
              var sum = item.count * item.price;
              menu.sum = sum;
              list.push(menu);
              orderAmount = orderAmount + sum;
            }
            prevPage.setData({
              listData: list,
              orderAmount: orderAmount
            });
            wx.navigateBack();
            select = true;
            wx.hideLoading();
          }).catch(console.error)
        }
      } else {
        // 模版编辑
        var item = e.currentTarget.dataset.val;
        var index = e.currentTarget.dataset.index;
        var letter = e.currentTarget.dataset.letter;
        wx.navigateTo({
          url: '../templateAdd/templateAdd?templateId=' + item._id + '&name=' + item.name + '&remark=' + item.remark + 
          '&index=' + index + '&letter=' + letter
        })
      }
    }
  },
  //点击删除按钮事件
  delItem: function(e) {
    var index = e.target.dataset.index;
    var letter = e.target.dataset.letter;
    var list = this.data.item.dataList;
    var _id = e.target.dataset.id;
    var that = this;
    wx.showModal({
      title: '提示',
      content: '是否确定删除?',
      success: function (res) {
        if (res.confirm) {
          templateCollection.doc(_id).remove({
            success: function (res) {
              for (var i = 0; i < list.length; i++) {
                if (list[i].letter == letter) {
                  var arr = list[i].data;
                  arr.splice(index, 1);
                  //更新列表的状态
                  that.setData({
                    ["item.dataList[" + i + "]"]: list[i]
                  });
                  break;
                }
              }
              // 更新缓存
              var sourceList = that.data.sourceList;
              for (var i in sourceList) {
                if (sourceList[i]._id == _id) {
                  sourceList.splice(i, 1);
                  break;
                }
              }
              app.setCacheData("templateList", sourceList);

              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 1000
              })
            }
          })

          // 删除明细
          var where = { templateId: _id};
          wx.cloud.callFunction({
            name: 'deleteAllData',
            data: {
              name: "templateDetail",
              where: where
            }
          }).then(res => {
            // console.log(res)
          })
            .catch(console.error)

        }
      }
    }) 
  },
  getData: function (where) {
    var that = this;
    if(where == undefined) {
      where = {};
    }
    wx.cloud.callFunction({
      name: 'getAllData',
      data: {
        name: "template",
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
          app.setCacheData("templateList", sourceList);
        }
      },
      fail: console.error
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
    if(this.data.searchText != '') {
      var where = {};
      where.name = this.data.searchText;
      this.getData(where);
    } else {
      var sourceList = app.getCacheData("templateList");
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

