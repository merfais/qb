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
    const values = []
    const sql = _.map(value, item => {
      const obj = key === '()' ? item : { [key]: item }
      const sub = buildObject(obj, tableName)
      values.push(...sub.value)
      return `(${sub.sql})`
    }).join(' or ')
    return { sql: `(${sql})`, values: values }
  }

  // 单个key，多个value直连，使用in，k: [v1, v2, v3] ==> k in (v1, v2, v3)
  return { sql: '?? in (?)', values: [key, value] }
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
    let sql = ''
    const values = []
    if (value.value || value.value === 0 || value.value === false) {
      // operator是'in', 'not in'
      if (/^((not)? *in)$/i.test(value.operator)) {
        sql += `?? ${value.operator} (?)`
        values.push(key, value.value)
        return { sql, values }
      }
      // operator是'is', 'is not', '!=', '>', '<', '>=', '<='
      if (/^(is *(not)?|!=|>|<|>=|<=)$/i.test(value.operator)) {
        sql += `?? ${value.operator} ?`
        values.push(key, value.value)
        return { sql, values }
      }
      // operator是 'like' 'not like'
      if (/^((not)? *like)$/i.test(value.operator)) {
        let val = `%${value.value}%`
        if (value.prefix) {
          val = `%${value.value}`
        } else if (value.suffix) {
          val = `${value.value}%`
        }
        sql += `?? ${value.operator} ?`
        values.push(key, val)
        return { sql, values }
      }
    }
    // 不支持的operator或者value无值，直接返回
    return { sql: '', values: [] }
  }

  // 1个key对应多个operator, 用and连接
  // k: {'>=': 1, '<=': 2}  ===> k >=1 and k <= 2
  if (/<|>|=|<=|>=|like|is/.test(Object.keys(value).join(''))) {
    const values = []
    const sql = _.reduce(value, (acc, vv, vopt) => {
      // 无值直接返回
      if (!vv && vv !== 0 && vv !== false) {
        return acc
      }
      let subSql = ''
      if (tableName) {
        values.push(tableName)
        subSql += '??.'
      }
      if (vopt === 'like') {
        values.push(key, `%${vv}%`)
        acc.push(subSql + '?? like ?')
      } else if (vopt === '%like') {
        values.push(key, `%${vv}`)
        acc.push(subSql + '?? like ?')
      } else if (vopt === 'like%') {
        values.push(key, `${vv}%`)
        acc.push(subSql + '?? like ?')
      } else {
        values.push(key, vv)
        acc.push(subSql + `?? ${vopt} ?`)
      }
      return acc
    }, []).join(' and ')
    return { sql, values }
  }

  // 未能匹配的情况
  return { sql: '', values: [] }
}

function buildItem(value, key, tableName = '') {
  let sql = ''
  const values = []
  // 无值直接返回
  if (_.isString(value) && /^[ \t\n]*$/.test(value)) {
    return { sql, values }
  }
  if (tableName) {
    sql += '??.'
    values.push(tableName)
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

