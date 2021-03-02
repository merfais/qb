const _ = require('./utils')
const select = require('./select')
const join = require('./join')
const where = require('./where')
const order = require('./order')
const group = require('./group')
const insert = require('./insert')
const aggregateFn = require('./aggregateFn')
const subFn = require('./subFn')

class SqlBuilder {
  sql = ''
  values = []

  select(fields, tableName) {
    if (this.sql) {
      this.sql += ';'
    }

    const { sql, values } = select(fields, tableName)
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
    if (sql) {
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
    if (!_.isObject(condition) && !_.isArray(condition) && !_.isFunction(condition)) {
      return this
    }
    if (!/ where /.test(this.sql)) {
      prefix = 'where'
    }
    const { sql, values } = where(condition, tableName)

    if (sql) {
      this.sql += ` ${prefix}`
      this.sql += ` ${sql}`
      this.values.push(...values)
    }
    return this
  }

  andWhere(condition, tableName = '') {
    return this.where(condition, tableName, 'and')
  }

  orWhere(condition, tableName = '') {
    return this.where(condition, tableName, 'or')
  }

  order(sort) {
    const { sql, values } = order(sort)
    if (sql) {
      this.sql += ` order by ${sql}`
      this.values.push(...values)
    }
    return this
  }

  limit(limit = 0) {
    const size = _.toPositiveInt(limit)
    if (!size) {
      return this
    }
    this.sql += ' limit ?'
    this.values.push(size)
    return this
  }

  offset(offset = 0) {
    const page = _.toPositiveInt(offset)
    if (!page) {
      return this
    }
    this.sql += ' offset ?'
    this.values.push(page)
    return this
  }

  page(size, page = 1) {
    const sizeInt = _.toPositiveInt(size)
    if (!sizeInt) {
      return this
    }
    this.limit(size)
    const pageInt = _.toPositiveInt(page)
    if (pageInt) {
      return this.offset((pageInt - 1) * sizeInt)
    }
    return this
  }

  group(fields, tableName) {
    const { sql, values } = group(fields, tableName)
    if (sql) {
      this.sql += sql
      this.values.push(...values)
    }
    return this
  }

  fn(fn, field, as) {
    const { sql, values } = aggregateFn(fn, field, as)
    if (sql) {
      this.sql += sql
      this.values.push(...values)
    }
    return this
  }

  count(as) {
    return this.fn('count', '*', as)
  }

  avg(field, as) {
    return this.fn('avg', field, as)
  }

  max(field, as) {
    return this.fn('max', field, as)
  }

  min(field, as) {
    return this.fn('min', field, as)
  }

  sum(field, as) {
    return this.fn('sum', field, as)
  }

  insert(tableName, data) {
    const { sql, values } = insert(tableName, data)

    if (!sql) {
      return this
    }

    if (this.sql) {
      this.sql += ';'
    }
    this.sql += sql
    this.values = this.values.concat(values)
    return this
  }

  update(tableName, data, where) {
    if (!_.isString(tableName)
      || !tableName
      || !_.isObject(data)
      || _.isEmpty(data)
    ) {
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
    if (!_.isString(tableName) || !tableName) {
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

  padEnd(sql, values) {
    // 如果sql是string则拼接到sql中，如果是array则拼接到values
    if (_.isString(sql)) {
      this.sql += sql
    } else if (_.isArray(sql)) {
      this.values = this.values.concat(sql)
      return this
    }
    if (_.isArray(values)) {
      this.values = this.values.concat(values)
    }
    return this
  }

  sub(fn) {
    const { sql, values } = subFn(fn)
    if (sql) {
      this.sql += sql
      this.values = this.values.concat(values)
    }
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
}

module.exports = SqlBuilder

