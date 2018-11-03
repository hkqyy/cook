// 使用了 async await 语法
const cloud = require('wx-server-sdk')
const db = cloud.database({
  env: 'test-8bacc9'
})
const _ = db.command

exports.main = async (event, context) => {
  var name = event.name;
  var where = event.where;
  try {
    return await db.collection("templateDetail").where({
      templateId: 'W8qAxZL-scb293PC'
    }).remove()
  } catch (e) {
    console.error(e)
  }
}