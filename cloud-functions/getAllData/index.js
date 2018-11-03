const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database({
  env: 'test-8bacc9'
})
const MAX_LIMIT = 100
exports.main = async (event, context) => {
  var name = event.name;
  // 先取出集合记录总数
  const countResult = await db.collection(name).count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  const _ = db.command;
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection(name).skip(i * MAX_LIMIT).limit(MAX_LIMIT).where({
      _openid: _.in([event.userInfo.openId, 'common'])
    }).get()
    tasks.push(promise)
  }
  // 等待所有
  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
      errMsg: acc.errMsg
    }
  })
}