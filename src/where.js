const _ = require('./utils')

/**
 * value是数组的场景，有两种情况
 * 1. 数组中是简单类型，用于in操作符，
 *    { a: [1,2,3] } => a in (1,2,3)
 * 2. 数组中是object类型, 用于and中嵌套or条件，
 *   这时key无意义，且当有多组时key不能重复
 *    {a: 1, orb: [{b: 2}, {a: 2}], orc: [{c: 1, d: 1}, {c: 3}], d = 4}
 *    => a = 1 and (b = 2 or a = 2) and ((c = 1 and d = 1) or c = 3) and d = 4
 */
function fromArray(value, key, tableName = '') {
  // k: [] 空数据，直接返回
  if (_.isEmpty(value)) {
    return { sql: '', values: [] }
  }

  let isSimpleType = true
  const objArr = []
  _.forEach(value, item => {
    if (!_.isSimpleType(item)) {
      isSimpleType = false
      if (_.isObject(item)) {
        objArr.push(item)
      }
    }
  })

  // value都是简单类型，使用in连接
  // k: [v1, v2, v3] ==> k in (v1, v2, v3)
  if (isSimpleType) {
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

  // value是复杂类型, 使用or连接，外层的key忽略
  // { anyKey: [{a: 1}, {b: 2}] } ==> a = 1 or b = 2
  return buildArray(objArr, tableName)
}

/**
 * value是只有operator，value两个key的object
 * key: { operator: '', value: '' }
 */
function fromOperatorValue(obj, key, tableName = '') {
  const { value, operator: op, suffix, prefix } = obj
  let sql = ''
  const values = []
  if (tableName) {
    sql += '??.'
    values.push(tableName)
  }
  sql += `?? ${op} ?`
  values.push(key)
  // operator是'in', 'not in', 'is', 'is not', '!=',
  //           '>', '<', '>=', '<=', '=', '<>', '<=>'
  if (/^((not *)?in|is( *not)?|!=|>|<|>=|<=|=|<>|<=>)$/i.test(op)) {
    if (_.isArray(value)) {
      values.push([value])
      return { sql, values }
    }
    if (_.isSimpleType(value) || value === null || value === undefined) {
      values.push(value)
      return { sql, values }
    }
  }
  // operator是 'like' 'not like'
  if (/^((not *)?like)$/i.test(op) && _.isSimpleType(value)) {
    let str = `%${value}%`
    if (prefix) {
      str = `%${value}`
    } else if (suffix) {
      str = `${value}%`
    }
    values.push(str)
    return { sql, values }
  }
  // 不支持的operator或者value无值，直接返回
  return { sql: '', values: [] }
}

/**
 * value是含多个key的object，且key都是operator
 * operator作为key, 支持多个operator的场景，用and连接
 * key: { '>=': 1, '<=': 2 }  ===> k >= 1 and k <= 2
 */
function fromMultiOperatorKey(obj, key, tableName = '') {
  let sqlArr = []
  const values = []
  _.forEach(obj, (val, op) => {
    let sql = ''
    if (tableName) {
      values.push(tableName)
      sql += '??.'
    }
    values.push(key)
    let value = val
    if (/in/.test(op)) {
      value = [val]
    } else if(/like/.test(op)) {
      const [, not, prefix, suffix] = op.match(/(not *)?(%?)like(%?)/)
      op = not ? 'not like' : 'like'
      if (prefix || suffix) {
        value = `${prefix}${val}${suffix}`
      } else {
        value = `%${val}%`
      }
    }
    values.push(value)
    sqlArr.push(sql + `?? ${op} ?`)
  })
  return { sql: sqlArr.join(' and '), values }
}

/**
 * value是对象的场景，有三种情况
 * 1. value同时含operator和value这两个字段，只提取这两个字段，其他字段忽略
 *    { a: { operator: '>', value: 1 } } => a > 1
 * 2. value的字段全部都是内置的operator，每组key，value间使用and连接
 *    { a: { '>': 1, '<': 10 } } => a > 1 and a < 10
 * 3. value的字段不满足以上两种，则是指定tableName的情况，
 *   key是table的名字, value作为完整的where item组装
 *    { t: { a: { '>': 1 }, b: 1, c: [1,2] } } => t.a > 1 and t.b = 1 and c in [1,2]
 */
function fromObject(value, key, tableName = '') {
  // 单个operator的场景，k: {operator: '', value: ''}
  if (_.has(value, 'operator') && _.has(value, 'value')) {
    return fromOperatorValue(value, key, tableName)
  }

  let allIsOperator = true
  const subObj = {}
  _.forEach(value, (v, op) => {
    const reg = /^(((not *)?(in|%?like%?))|is( *not)?|!=|>|<|>=|<=|=|<>|<=>)$/i
    if (!reg.test(op)) {
      allIsOperator = false
      subObj[op] = v
    }
  })
  if (allIsOperator) {
    // 1个key对应多个operator, 用and连接
    // k: {'>=': 1, '<=': 2}  ===> k >=1 and k <= 2
    return fromMultiOperatorKey(value, key, tableName)
  }

  // 当value对象的key中存在不是operator的key时，
  // 认为是指定tableName的场景, key作为tableName, value作为结构化数据
  // { tableA: { a: 1 } }
  return buildObject(subObj, key)
}

function buildItem(value, key, tableName = '') {
  // 无值直接返回
  if (_.isString(value) && /^[ \t\n]*$/.test(value)) {
    return { sql: '', values: [] }
  }
  // 数组使用in 或者 使用or连接多个value场景
  if (_.isArray(value)) {
    return fromArray(value, key, tableName)
  }

  // object 使用and链接
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
  sql += '?'
  values.push({ [key]: value })
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
    const result = buildItem(value, key, tableName)
    if (result.values.length && result.sql) {
      values.push(...result.values)
      if (/ or /.test(result.sql)) {
        sqlArr.push(`(${result.sql})`)
      } else {
        sqlArr.push(result.sql)
      }
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
    const result= buildObject(item, tableName)
    if (result.values.length && result.sql) {
      values.push(...result.values)
      if (/ and /.test(result.sql)) {
        sqlArr.push(`(${result.sql})`)
      } else {
        sqlArr.push(result.sql)
      }
    }
  })
  return { values, sql: sqlArr.join(' or ') }
}

module.exports = function where(where, tableName) {
  return _.isArray(where)
    ? buildArray(where, tableName) // [{k:v},{k:v},{k:v}]使用or连接
    : buildObject(where, tableName) // {k:v,k:v,k:v} 使用 and 连接
}

