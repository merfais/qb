const _ = require('./utils')

function fromArray(fields, tableName) {
  const sqlArr = []
  const values = []
  _.forEach(fields, field => {
    if (!_.isString(field) || !field.trim()) {
      return
    }
    if (_.isString(tableName) && tableName.trim()) {
      sqlArr.push('??.??')
      values.push(tableName.trim(), field.trim())
    } else {
      sqlArr.push('??')
      values.push(field.trim())
    }
  })
  return { sqlArr, values }
}

module.exports = function group(fields, tableName) {
  if (_.isArray(fields)) {
    const { sqlArr, values } = fromArray(fields, tableName)
    if (sqlArr.length) {
      return { sql: ` group by ${sqlArr.join(', ')}`, values }
    }
  }

  if (_.isObject(fields)) {
    let sqlArr = []
    let values = []
    _.forEach(fields, (item, table) => {
      const fieldArr = _.isArray(item) ? item : [item]
      const result = fromArray(fieldArr, table)
      sqlArr = sqlArr.concat(result.sqlArr)
      values = values.concat(result.values)
    })
    if (sqlArr.length) {
      return { sql: ` group by ${sqlArr.join(', ')}`, values }
    }
  }

  const { sqlArr, values } = fromArray([fields], tableName)
  if (sqlArr.length) {
    return { sql: ` group by ${sqlArr.join(', ')}`, values }
  }
  return { sql: '', values: [] }
}

