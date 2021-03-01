const _ = require('./utils')

module.exports = function fn(fn, field, as) {
  let sql = ''
  const values = []
  let tableName = ''
  if (_.isArray(field) && _.isString(field[0]) && _.isString(field[1])) {
    tableName = field[0].trim()
    field = field[1]
  }
  if (_.isString(field) && field.trim()) {
    field = field.trim()
    if (field === '*') {
      sql += `${fn}(*)`
    } else {
      if (tableName) {
        sql += `${fn}(??.??)`
        values.push(tableName, field)
      } else {
        sql += `${fn}(??)`
        values.push(field)
      }
    }
    if (_.isString(as) && as.trim()) {
      sql += ' as ??'
      values.push(as.trim())
    }
  }
  return { sql, values }
}

