const _ = require('./utils')
const select = require('./select')
const join = require('./join')
const where = require('./where')

const ORDER = {
  ASC: 'asc',
  DESC: 'desc',
}

class SqlBuilder {
  sql = ''
  values = []

  select(fields) {
    if (this.sql) {
      this.sql += ';'
    }

    const { sql, values } = select(fields)
    if (sql.length) {
      this.sql += `select ${sql.join(', ')}`
      this.values.push(...values)
    } else {
      this.sql += 'select *'
    }
    return this
  }

  from(tableName, rename) {
    if (!tableName) {
      return this
    }
    this.fromTable = tableName
    this.sql += ' from ??'
    this.values.push(tableName)
    if (rename) {
      this.sql += ' ??'
      this.values.push(rename)
    }
    return this
  }

  selectCount(as = 'count', tableName, where) {
    if (this.sql) {
      this.sql += ';'
    }
    this.sql += 'select count(*) as ??'
    this.values.push(as)
    this.from(tableName)
    this.where(where)
    return this
  }

  join(target, mapping, source, prefix = '') {
    if (_.isObject(target)) {
      prefix = mapping
      mapping = target.mapping
      source = target.source
      target = target.target
    }
    source = source || this.fromTable
    if (this.joinPrefix) {
      prefix = this.joinPrefix
      this.joinPrefix = ''
    }
    const { sql, values } = join(target, source, mapping, prefix)
    if (sql.length) {
      this.sql += sql
      this.values.push(...values)
    }
    return this
  }

  leftJoin(...args) {
    this.joinPrefix = 'left'
    return this.join(...args)
  }

  rightJoin(...args) {
    this.joinPrefix = 'right'
    return this.join(...args)
  }

  innerJoin(...args) {
    this.joinPrefix = 'inner'
    return this.join(...args)
  }

  outerJoin(...args) {
    this.joinPrefix = 'outer'
    return this.join(...args)
  }

  crossJoin(...args) {
    this.joinPrefix = 'cross'
    return this.join(...args)
  }

  where(condition, tableName = '', prefix = 'where') {
    if (!condition || _.isEmpty(condition)) {
      return this
    }
    const rst = where(condition, tableName)
    if (rst.sql && rst.values.length) {
      this.sql += ` ${prefix}`
      this.sql += ` ${rst.sql}`
      this.values.push(...rst.values)
    }
    return this
  }

  andWhere(...args) {
    return this.where(...args, 'and')
  }

  orWhere(...args) {
    return this.where(...args, 'or')
  }

  /**
   * 拼接order by
   * @param {String|}
   *
   * @example
   * // sort = 'a'         => ' order by a asc'
   * // sort = 'a desc'  => ' order by a desc'
   * // sort = { a: 'desc', b: 'asc' } => ' order by a desc, b asc'
   */
  order(sort) {
    if (!sort) {
      return this
    }
    this.sql += ' order by'
    if (typeof sort === 'string') {
      const [field, order] = sort.split(/ +/)
      this.sql += ` ?? ${ORDER[_.upperCase(order)] || ORDER.ASC}`
      this.values.push(field)
    } else {
      this.sql += _.map(sort, (order, field) => {
        return ` ?? ${ORDER[_.upperCase(order)] || ORDER.ASC}`
        this.values.push(field)
      }).join(', ')
    }
    return this
  }

  limit(page, size) {
    const sizeInt = Number.parseInt(size, 10)
    if (Number.isNaN(sizeInt) || sizeInt < 1) {
      return this
    }
    this.sql += ' limit ?'
    this.values.push(sizeInt)

    const pageInt = Number.parseInt(page, 10)
    if (Number.isNaN(pageInt) || pageInt < 1) {
      return this
    }
    this.sql += ' offset ?'
    this.values.push((pageInt - 1) * sizeInt)
    return this
  }

  withTotal(tableName, where) {
    if (!this.sql || !tableName) {
      return this
    }
    this.sql += ' select count(*) as `total` from ??'
    this.values.push(tableName)
    this.where(where)
    return this
  }

  insert(tableName, data) {
    if (!tableName || _.isEmpty(data)) {
      return this
    }
    if (this.sql) {
      this.sql += ';'
    }
    this.sql += 'insert into ?? '
    this.values.push(tableName)
    if (_.isObject(data)) {
      this.sql += 'set ?'
      this.values.push(data)
      return this
    }
    if ((_.isArray(data) && data.length === 1)) {
      this.sql += 'set ?'
      this.values.push(data[0])
      return this
    }
    const fields = Object.keys(_.reduce(data, (acc, obj) => {
      Object.assign(acc, obj)
      return acc
    }, {})).sort()
    const fieldsHolder = _.fill(Array(fields.length), '??').join(', ')
    this.sql += `(${fieldsHolder}) values ?`
    const values = _.map(data, obj => {
      return _.map(fields, field => obj[field])
    })
    this.values.push(...fields, values)
    return this
  }

  update(tableName, data, where) {
    if (!tableName || _.isEmpty(data)) {
      return this
    }
    if (this.sql) {
      this.sql += ';'
    }
    this.sql += 'update ?? set ?'
    this.values.push(tableName, data)
    this.where(where)
    return this
  }

  delete(tableName, where) {
    if (!tableName || _.isEmpty(where)) {
      return this
    }
    if (this.sql) {
      this.sql += ';'
    }
    this.sql += 'delete from ??'
    this.values.push(tableName)
    this.where(where)
    return this
  }

  toQuery() {
    return [this.sql, this.values]
  }

  clear() {
    this.sql = ''
    this.values = []
    this.fromTable= ''
    return this
  }

  build() {
    let sql = ''
    let values = []
    if (this.select) {
      sql += 'select'
      values = values.concat(this.select.values)
    } else if (this.insert) {
      sql += 'insert'
    } else if (this.update) {
      sql += 'update'
    } else if (this.delete) {
      sql += 'delete'
    }
  }
}

module.exports = SqlBuilder
