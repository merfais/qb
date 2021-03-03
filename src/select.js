const _ = require('./utils')
const subFn = require('./subFn')

function fromArray(fields, table) {
  const sql = []
  const values = []
  const tableName = _.isString(table) ? table.trim() : ''

  _.forEach(fields, (field) => {
    if (_.isBoolean(field) || _.isNumber(field)) {
      // tableName不能和bool, number连接
      if (!tableName) {
        sql.push('?')
        values.push(field)
      }
      return
    }

    if (_.isString(field) && field.trim()) {
      if (tableName) {
        sql.push('??.??')
        values.push(tableName, field.trim())
      } else {
        sql.push('??')
        values.push(field.trim())
      }
      return
    }

    if (_.isFunction(field)) {
      const result = subFn(field, tableName)
      if (result.sql) {
        sql.push(result.sql)
        values.push(...result.values)
      }
      return
    }

    if (_.isArray(field)
      && !/^[ \t\n]*$/.test(field[0]) && _.isSimpleType(field[0])
      && _.isString(field[1]) && field[1].trim()
    ) {
      if (_.isNumber(field[0]) || _.isBoolean(field[0])) {
        // tableName不能和bool, number连接
        if (!tableName) {
          sql.push('? as ??')
          values.push(field[0], field[1].trim())
        }
        return
      }
      if (tableName) {
        sql.push('??.?? as ??')
        values.push(tableName)
      } else {
        sql.push('?? as ??')
      }
      values.push(field[0], field[1].trim())
    }
  })
  return { sql, values }
}

function fromObject(obj) {
  const sql = []
  const values = []

  _.forEach(obj, (fields, tableName) => {
    // { tableName: [] | {} | '' }
    if (_.isEmpty(fields)) {
      sql.push('??.*')
      values.push(tableName)
      return
    }
    // { tableName: ['a', 'b'] }
    if (_.isArray(fields)) {
      const result = fromArray(fields, tableName)
      sql.push(...result.sql)
      values.push(...result.values)
      return
    }
    // { tableName: { a: 'renameA', b: 'renameB' } }
    if (_.isObject(fields)) {
      _.forEach(fields, (rename, field) => {
        if (_.isString(rename) && rename.trim()) {
          sql.push('??.?? as ??')
          values.push(tableName, field, rename.trim())
          return
        }

        if (_.isFunction(rename)) {
          const result = subFn(rename, tableName, field)
          if (result.sql) {
            sql.push(result.sql)
            values.push(...result.values)
          }
          return
        }

        sql.push('??.??')
        values.push(tableName, field)
      })
    }
    // { a: 'renameA' }
    // fields是string时是重命名，不含table信息
    if (_.isString(fields) && fields.trim()) {
      sql.push('?? as ??')
      values.push(tableName, fields.trim())
    }

    // { tableName: () => {}}
    if (_.isFunction(fields)) {
      const result = subFn(fields, tableName)
      if (result.sql) {
        sql.push(result.sql)
        values.push(...result.values)
      }
    }
  })

  return { sql, values }
}

module.exports = function select(fields, tableName) {
  if (_.isBoolean(fields) || _.isNumber(fields)) {
    return { sql: ['?'], values: [fields] }
  }

  // fields = 'a'
  if (_.isString(fields) && fields.trim()) {
    return { sql: ['??'], values: [fields.trim()] }
  }

  if (_.isFunction(fields)) {
    const result = subFn(fields)
    if (result.sql) {
      return { sql: [result.sql], values: result.values }
    }
    return { sql: ['*'], values: [] }
  }

  if (_.isEmpty(fields)) {
    return { sql: ['*'], values: [] }
  }

  // fields = ['a', 'b', 'c']
  if (_.isArray(fields)) {
    return fromArray(fields, tableName)
  }

  // fields = { table1: [], table2: {}}
  if (_.isObject(fields)) {
    return fromObject(fields)
  }

  return { sql: [], values: [] }
}

