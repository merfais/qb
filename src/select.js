const _ = require('./utils')

function fromArray(fields, tableName) {
  const sql = []
  const values = []

  _.forEach(fields, (field) => {
    if (_.isBoolean(field) || _.isNumber(field)) {
      if (!tableName) {
        sql.push('?')
        values.push(field)
      }
      return
    }

    if (!/^[ \t\n]*$/.test(field) && _.isString(field)) {
      if (tableName) {
        sql.push('??.??')
        values.push(tableName, field)
      } else {
        sql.push('??')
        values.push(field)
      }
      return
    }

    if (_.isArray(field)
      && !/^[ \t\n]*$/.test(field[0]) && _.isSimpleType(field[0])
      && !/^[ \t\n]*$/.test(field[1]) && _.isString(field[1])
    ) {
      if (_.isNumber(field[0]) || _.isBoolean(field[0])) {
        if (!tableName) {
          sql.push('? as ??')
          values.push(field[0], field[1])
        }
        return
      }
      if (tableName) {
        sql.push('??.?? as ??')
        values.push(tableName)
      } else {
        sql.push('?? as ??')
      }
      values.push(field[0], field[1])
      return
    }
  })
  return { sql, values }
}

function fromObject(obj) {
  const sql = []
  const values = []

  _.forEach(obj, (fields, tableName) => {
    // fields = [] or fields = {} or fields = ''
    if (_.isEmpty(fields)) {
      sql.push('??.*')
      values.push(tableName)
      return
    }
    // fields = ['a', 'b', 'c']
    if (_.isArray(fields)) {
      const result = fromArray(fields, tableName)
      sql.push(...result.sql)
      values.push(...result.values)
      return
    }
    // fields = { a: 'renameA', b: 'renameB' }
    if (_.isObject(fields)) {
      _.forEach(fields, (rename, field) => {
        if (rename) {
          sql.push('??.?? as ??')
          values.push(tableName, field, rename)
        }
      })
    }
    // { a: 'renameA' }
    if (_.isString(fields)) {
      sql.push('?? as ??')
      values.push(tableName, fields)
    }
  })

  return { sql, values }
}

module.exports = function select(fields) {
  if (_.isBoolean(fields) || _.isNumber(fields)) {
    return { sql: ['?'], values: [fields] }
  }

  // fields = 'a'
  if (_.isString(fields) && !/^[ \t\n]*$/.test(fields)) {
    return { sql: ['??'], values: [fields] }
  }

  if (_.isEmpty(fields)) {
    return { sql: ['*'], values: [] }
  }

  // fields = ['a', 'b', 'c']
  if (_.isArray(fields)) {
    return fromArray(fields)
  }

  // fields = { table1: [], table2: {}}
  if (_.isObject(fields)) {
    return fromObject(fields)
  }

  return { sql: [], values: [] }
}

