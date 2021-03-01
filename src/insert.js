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

  // 不是object，则是array
  // 如果是数组且只有一个item，按object处理
  if (data.length === 1 && _.isObject(data[0])) {
    sql += 'set ?'
    values.push(data[0])
    return { sql, values }
  }

  // 提取所有的字段
  const fieldMap = {}
  _.forEach(data, item => {
    if (_.isObject(item)) {
      Object.assign(fieldMap, item)
    }
  })

  const fields = Object.keys(fieldMap).sort()
  const fieldsHolder = _.map(fields, i => '??').join(', ')
  sql += `(${fieldsHolder}) values ?`
  const values = _.map(data, obj => {
    return _.map(fields, field => obj[field])
  })
  values.push(...fields, values)
}
