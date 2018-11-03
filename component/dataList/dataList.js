let _compData = {
  '_toast_.isHide': false,// 控制组件显示隐藏
  '_toast_.content': ''// 显示的内容
}
let dataListTemp = {
  searchTextChange: function(e) {
    var searchText = e.detail.value;
    this.setData({
      searchText: searchText
    });
  },
  //点击字母
  letterTap(e) {
    var item = e.currentTarget.dataset.item;
    this.setData({
      'item.firstLetter': item
    });
  },
  touchS: function (e) {
    if (e.touches.length == 1) {
      this.setData({
        //设置触摸起始点水平方向位置
        startX: e.touches[0].clientX
      });
    }
  },
  touchM: function (e) {
    if (e.touches.length == 1) {
      //手指移动时水平方向位置
      var moveX = e.touches[0].clientX;
      //手指起始点位置与移动期间的差值
      var disX = this.data.startX - moveX;
      var delBtnWidth = this.data.delBtnWidth;
      if (disX > 100) { //移动距离大于0，文本层left值等于手指移动距离
        //获取手指触摸的是哪一项
        var index = e.currentTarget.dataset.index;
        var letter = e.currentTarget.dataset.letter;
        var list = this.data.item.dataList;

        for (var i = 0; i < list.length; i++) {
          if (list[i].letter == letter) {
            var arr = list[i].data;
            arr[index].display = "block";
            this.setData({
              ["item.dataList[" + i + "]"]: list[i]
            });
            break;
          }
        }
      }
    }
  },
  formatList: function (dataList, selectDataList) {
    var jsonData = {
      "A": [], "B": [], "C": [], "D": [], "E": [], "F": [], "G": [], "H": [], "I": [],
      "J": [], "K": [], "L": [], "M": [], "N": [], "O": [], "P": [], "Q": [], "R": [], "S": [], "T": [],
      "U": [], "V": [], "W": [], "X": [], "Y": [], "Z": [], "#": []
    };

    if (selectDataList != undefined && selectDataList.length > 0) {
      for (var i = 0; i < dataList.length; i++) {
        var item = dataList[i];
        item.display = 'none';
        // 已经被选择的数据添加标识为S
        for (var j in selectDataList) {
          if (item.name == selectDataList[i]) {
            item.select = 'S';
          }
        }
        jsonData[item.letter].push(item);
      }
    } else {
      for (var i = 0; i < dataList.length; i++) {
        var item = dataList[i];
        item.display = 'none';
        jsonData[item.letter].push(item);
      }
    }


 
    var list = [];
    // 右侧首字母列表
    var letterList = [];
    for (var key in jsonData) {
      if (jsonData[key].length > 0) {
        var obj = {};
        obj.letter = key;
        obj.data = jsonData[key];
        list.push(obj);
        letterList.push(key)
      }
    }
    this.setData({
      'item.letterList': letterList
    })
    return list;
  },
}
function DataListTemp() {
  // 拿到当前页面对象
  let pages = getCurrentPages();
  let curPage = pages[pages.length - 1];
  this.__page = curPage;
  Object.assign(curPage, dataListTemp);
  // 附加到page上，方便访问
  curPage.dataListTemp = this;
  // 把组件的数据合并到页面的data对象中
  return this;
}
module.exports = {
  DataListTemp
}