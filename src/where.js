const _ = require('./utils')

function fromArray(value, key, tableName = '') {
  // k: [] 空数据，直接返回
  if (_.isEmpty(value)) {
    return { sql: '', values: [] }
  }

  // 多object组合，object间使用or连接
  // 特殊key, 真实的多个key在对象中,
  //     '()': [{k1:v1}, {k2:v2}] ===> (k1 = v1 or k2 = v2)
  // 单个key，多个value和操作符组合
  //     k: [{operator: '>', value: v1}, {>: v2}] ==> (k < v1 or k > v2)
  if (_.isObject(value[0])) {
    sql += _.map(value, item => {
      const obj = key === '()' ? item : { [key]: item }
      const sub = buildObject(obj, tableName)
      values.push(...sub.value)
      return `(${sub.sql})`
    }).join(' or ')

    return { sql: `(${sql})`, values: values }
  }

  // 单个key，多个value直连，使用in，k: [v1, v2, v3] ==> k in (v1, v2, v3)
  let sql = ''
  const values = []
  if (tableName) {
    sql += '??.'
    values.push(tableName)
  }

  sql += '?? in (?)'
  values.push(key, value)
  return { sql, values }
}

function fromObject(value, key, tableName = '') {
  // 特殊key， objec是多组key, value的组合,
  // '()': { k1:v1, k2:v2 } ===> (k1 = v1 or k2 = v2)
  if (key === '()') {
    const values = []
    const sql = _.map(value, (v, k) => {
      const sub = buildItem(v, k, tableName)
      values.push(...sub.values)
      return sub.sql
    }).join(' or ')
    return { sql: `(${sql})`, values: values }
  }

  // 单个operator的场景，k: {operator: '', value: ''}
  if (_.has(value, 'operator') && _.has(value, 'value')) {
    const { value: val, operator: op, suffix, prefix } = value
    let sql = ''
    const values = []
    if (tableName) {
      sql += '??.'
      values.push(tableName)
    }
    sql += `?? ${op} ?`
    values.push(key)
    // operator是'in', 'not in', 'is', 'is not', '!=', '>', '<', '>=', '<=', '=', '<>', '<=>'
    if (/^((not *)?in|is( *not)?|!=|>|<|>=|<=|=|<>|<=>)$/i.test(op)) {
      if (_.isArray(val)) {
        values.push([val])
        return { sql, values }
      }
      if (_.isSimpleType(val) || val === null || val === undefined) {
        values.push(val)
        return { sql, values }
      }
    }
    // operator是 'like' 'not like'
    if (/^((not *)?like)$/i.test(op) && _.isSimpleType(val)) {
      let str = `%${val}%`
      if (prefix) {
        str = `%${val}`
      } else if (suffix) {
        str = `${val}%`
      }
      values.push(str)
      return { sql, values }
    }
    // 不支持的operator或者value无值，直接返回
    return { sql: '', values: [] }
  }

  // 1个key对应多个operator, 用and连接
  // k: {'>=': 1, '<=': 2}  ===> k >=1 and k <= 2
  let sqlArr = []
  const values = []
  _.forEach(value, (val, op) => {
    if (!/^(((not *)?(in|%?like%?))|is( *not)?|!=|>|<|>=|<=|=|<>|<=>)$/i.test(op)) {
      return
    }
    let sql = ''
    if (tableName) {
      values.push(tableName)
      sql += '??.'
    }
    values.push(key)
    if (/in/.test(op)) {
      val = [val]
    } else if(/like/.test(op)) {
      const [, not, prefix, suffix] = op.match(/(not *)?(%?)like(%?)/)
      op = not ? 'not like' : 'like'
      if (prefix || suffix) {
        val = `${prefix}${val}${suffix}`
      } else {
        val = `%${val}%`
      }
    }
    values.push(val)
    sqlArr.push(sql + `?? ${op} ?`)
  })
  return { sql: sqlArr.join(' and '), values }
}

function buildItem(value, key, tableName = '') {
  // 无值直接返回
  if (_.isString(value) && /^[ \t\n]*$/.test(value)) {
    return { sql: '', values: [] }
  }
  // 使用or连接多个value场景
  if (_.isArray(value)) {
    return fromArray(value, key, tableName)
  }

  // object 复杂表达式
  if (_.isObject(value)) {
    return fromObject(value, key, tableName)
  }

  // value是简单类型，1个key对应1个value, k: v
  let sql = ''
  const values = []
  if (tableName) {
    sql += '??.'
    values.push(tableName)
  }
  sql += '?? = ?'
  values.push(key, value)
  return { sql, values }
}

/**
 * 拼接where语句
 * @param {Object} obj 结构化语句数据
 * @return {{ subArr: Array<any>, subStr: string }}
 *
 * @example
 * // subStr: '                        subArr: [
 * //   ?? = ?                           k1, v1,
 * //   and ?? in (?)                    k2, [v2, v3],
 * //   and (?? < ? or ?? > ?)           k3, v4, k3, v5,
 * //   and (?? = ? or ?? = ?)           k4, v6, k5, v7,
 * //   and ?? > ? and ?? < ?            k6, v8, k6, v9,
 * //   and ?? in (?)                    k7, v10,
 * //   and ?? is not ?                  k8, v11,
 * //   and ((?? = ? and ?? = ?)         k9, v12, k10, v13
 * //     or (?? = ? and ?? = ?))        k11, v14, k12, v15
 * // '                                ]
 * obj = {
 *   k1: v1,                           // value是简单类型
 *   k2: [v2, v3]                      // value是array，且内部是简单类型
 *   k3: [                             // value是array
 *     { operator: '<', value: v4 },   //   且内部是带operator，value的对象
 *     { operator: '>', value: v5 },
 *   ],
 *   '()': {                           // key是特殊值, value是object
 *     k4: v6,                         //   且object含多个key value
 *     k5: v7,
 *   },
 *   k6: {                             // value是object
 *     '>': v8,                        //   且内部key是operator，value是简单类型
 *     '<': v9                         //   operator可用 >, <, =, >=, <=,
 *   },
 *   k7: {
 *     operator: 'in',                 // value是object
 *     value: v10,                     //   且内部是带operator，value的对象
 *   },                                //   operator可用 in, not in, is, is not, !=, <, >, <=, >=
 *   k8: {
 *     operator: 'is not',
 *     value: v11,
 *   },
 *   {}: [                             // key是特殊值，value是array
 *     {k9: v12, k10: v13},            //   且内部是object，含1个或多个key value
 *     {k11: v14, k12: v15},
 *   ]
 * }
 */
function buildObject(obj, tableName = '') { // {k:v,k:v,k:v} 使用 and 连接
  const values = []
  const sqlArr = []
  _.forEach(obj, (value, key) => {
    const rst = buildItem(value, key, tableName)
    if (rst.values && rst.values.length && rst.sql) {
      values.push(...rst.values)
      sqlArr.push(rst.sql)
    }
  })
  return { values, sql: sqlArr.join(' and ') }
}

/**
 * 拼接where语句
 * @param {Array<Object>} arr 结构化语句数据
 * @return {{ subArr: Array<any>, subStr: string }}
 *
 * @example
 * // subStr: '                         subArr: [
 * //   ?? = ?                              k0, v0,
 * //   or (
 * //     ?? = ?                            k1, v1,
 * //     and ?? in (?)                     k2, [v2, v3],
 * //     and (?? < ? or ?? > ?)            k3, v4, k3, v5,
 * //     and (?? = ? or ?? = ?)            k4, v6, k5, v7,
 * //     and ?? > ? and ?? < ?             k6, v8, k6, v9,
 * //     and ?? in (?)                     k7, v10,
 * //     and ?? is not ?                   k8, v11,
 * //     and ((?? = ? and ?? = ?)          k9, v12, k10, v13
 * //       or (?? = ? and ?? = ?))         k11, v14, k12, v15
 * //   )
 * // '                                 ]
 * arr = [
 *   { k0: v0 },                        // value是简单类型
 *   {
 *     k1: v1,                           // value是简单类型
 *     k2: [v2, v3]                      // value是array，且内部是简单类型
 *     k3: [                             // value是array
 *       { operator: '<', value: v4 },   //   且内部是带operator，value的对象
 *       { operator: '>', value: v5 },
 *     ],
 *     '()': [                           // key是特殊值, value是array
 *       { k4: v6, k5: v7}               //   且内部是object，含多个key value
 *     ],
 *     k6: {                             // value是object
 *       '>': v8,                        //   且内部key是operator，value是简单类型
 *       '<': v9                         //   operator可用 >, <, =, >=, <=,
 *     },
 *     k7: {
 *       operator: 'in',                 // value是object
 *       value: v10,                     //   且内部是带operator，value的对象
 *     },                                //   operator可用 in, not in, is, is not, !=, <, >, <=, >=
 *     k8: {
 *       operator: 'is not',
 *       value: v11,
 *     }
 *   },
 * }
 */
function buildArray(arr, tableName = '') { // [{k:v},{k:v},{k:v}]使用or连接
  const values = []
  const sqlArr = []
  _.forEach(arr, item => {
    const keys = Object.keys(item)
    const rst = buildObject(item, tableName)
    values.push(...rst.values)
    // 1个key与value {k:v}
    if (keys.length === 1) {
      sqlArr.push(rst.sql)
    } else {
      // 多个 {k:v, k:v, k:v}
      sqlArr.push(`(${rst.sql})`)
    }
  })
  return { values, sql: sqlArr.join(' or ') }
}

module.exports = function where(where, tableName) {
  return _.isArray(where)
    ? buildArray(where, tableName) // [{k:v},{k:v},{k:v}]使用or连接
    : buildObject(where, tableName) // {k:v,k:v,k:v} 使用 and 连接
}

