const _ = require('./utils')

module.exports = function insert(tableName, data) {
  if (!_.isString(tableName) || !tableName.trim()) {
    return { sql: '', values: [] }
  }
  if ((!_.isObject(data) && !_.isArray(data)) || _.isEmpty(data)) {
    return { sql: '', values: [] }
  }
  let sql = 'insert into ?? '
  const values = [tableName]

  // 按object写入 {a: 1, b: 2} => a = 1, b =2
  if (_.isObject(data)) {
    sql += 'set ?'
    values.push(data)
    return { sql, values }
  }

  // 提取所有的Object，字段
  const fieldMap = {}
  const objData = []
  _.forEach(data, item => {
    if (_.isObject(item) && !_.isEmpty(item)) {
      Object.assign(fieldMap, item)
      objData.push(item)
    }
  })

  if (!objData.length) {
    return { sql: '', values: [] }
  }

  // 如果是数组且只有一个item，按object处理
  if (objData.length === 1) {
    sql += 'set ?'
    values.push(objData[0])
    return { sql, values }
  }

  // 多个item，使用values插入多行
  const fields = Object.keys(fieldMap)

  const fieldsHolder = _.map(fields, () => '??').join(', ')
  sql += `(${fieldsHolder}) values ?`

  const valueArr = _.map(data, obj => {
    return _.map(fields, field => obj[field])
  })
  values.push(...fields, valueArr)
  return { sql, values }
}

