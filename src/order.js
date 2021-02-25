const _ = require('./utils')

module.exports = function order(sort) {
  const values = []
  if (_.isString(sort)) {
    const [field, order] = sort.trim().split(/ +/)
    if (!field) {
      return { sql: '', values }
    }
    let sql = '??'
    values.push(field)
    if (order && /^(asc|desc)$/i.test(order.trim())) {
      sql += ` ${order.trim()}`
    }
    return { sql, values }
  }
  if (_.isObject(sort)) {
    const sqlArr = []
    _.forEach(sort, (order, field) => {
      let sql = '??'
      if (_.isString(order) && /^(asc|desc)$/i.test(order.trim())) {
        sql += ` ${order.trim()}`
      }
      sqlArr.push(sql)
      values.push(field)
    })
    return { sql: sqlArr.join(', '), values }
  }
  return { sql: '', values }
}
