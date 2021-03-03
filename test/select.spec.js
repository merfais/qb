const mysql = require('mysql')
const Builder = require('..')

describe('select', () => {
  let qb
  let query
  let sql
  let des

  beforeEach(() => {
    qb = new Builder()
  })

  it('select()', () => {
    query = qb.clear().select().toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select(null).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select(undefined).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select('').toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({}).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select([]).toQuery();
    expect(mysql.format(...query)).toBe('select *')
  })

  it('select(fields: string|number|boolean)', () => {
    query = qb.clear().select('a').toQuery();
    expect(mysql.format(...query)).toBe('select `a`')

    query = qb.clear().select('a').toQuery();
    expect(mysql.format(...query)).toBe('select `a`')

    query = qb.clear().select('    ').toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select(1).toQuery();
    expect(mysql.format(...query)).toBe('select 1')

    query = qb.clear().select(true).toQuery();
    expect(mysql.format(...query)).toBe('select true')
  })

  it('select(fields: (qb) => {sql: string, values: Array}|qb|void)', () => {
    query = qb.clear().select(() => ({})).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select(() => ({
      sql: 'count(*) as ??',
      values: ['count'],
    })).toQuery();
    expect(mysql.format(...query)).toBe('select count(*) as `count`')

    query = qb.clear().select((builder) => builder.count('count')).toQuery();
    expect(mysql.format(...query)).toBe('select count(*) as `count`')

    query = qb.clear().select(function () { this.count('count') }).toQuery();
    expect(mysql.format(...query)).toBe('select count(*) as `count`')
  })

  it('select(fields: <string|boolean|number|<string|boolean|number>[]>[])', () => {
    query = qb.clear().select(['a', 'b']).toQuery();
    expect(mysql.format(...query)).toBe('select `a`, `b`')

    query = qb.clear().select([1, true]).toQuery();
    expect(mysql.format(...query)).toBe('select 1, true')

    query = qb.clear().select(['a', '']).toQuery();
    expect(mysql.format(...query)).toBe('select `a`')

    // illegal input
    query = qb.clear().select([1, '  ']).toQuery();
    expect(mysql.format(...query)).toBe('select 1')

    query = qb.clear().select(['a', true]).toQuery();
    expect(mysql.format(...query)).toBe('select `a`, true')

    query = qb.clear().select([['a', 'b'], 'c']).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `b`, `c`')

    query = qb.clear().select([[1, 'true'], [true, '1']]).toQuery();
    expect(mysql.format(...query)).toBe('select 1 as `true`, true as `1`')

    // illegal input
    query = qb.clear().select([[1, true], [true, 1]]).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    // illegal input
    query = qb.clear().select([['a'], ['a', ''], [' ', 'a'], []]).toQuery();
    expect(mysql.format(...query)).toBe('select *')
  })

  it('select(fields: <(qb) => {sql: string, values: Array}|qb|void>[])', () => {
    query = qb.clear().select(['a', () => ({})]).toQuery();
    expect(mysql.format(...query)).toBe('select `a`')

    query = qb.clear().select(['a', () => ({
      sql: 'max(??)',
      values: ['b'],
    })]).toQuery();
    expect(mysql.format(...query)).toBe('select `a`, max(`b`)')

    query = qb.clear().select(['a', (builder) => {
      builder.max('b', 'maxb')
    }]).toQuery();
    expect(mysql.format(...query)).toBe('select `a`, max(`b`) as `maxb`')

    query = qb.clear().select(['a', function (builder, tableName) {
      this.max([tableName, 'b'], 'maxb')
    }], 't').toQuery();
    expect(mysql.format(...query)).toBe('select `t`.`a`, max(`t`.`b`) as `maxb`')
  })

  it('select(fields: { [key:string]: string })', () => {
    query = qb.clear().select({ a: '' }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.*')

    query = qb.clear().select({ a: 'b' }).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `b`')

    // illegal input
    query = qb.clear().select({ a: 1 }).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    // illegal input
    query = qb.clear().select({ a: true }).toQuery()
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({ a: 'b', c: 1 }).toQuery()
    expect(mysql.format(...query)).toBe('select `a` as `b`')
  })

  it('select(fields: { [key]: string : (qb) => {sql: string, values: Array}|qb|void)', () => {
    query = qb.clear().select({ a: () => ({}) }).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({
      a: 'ra',
      b: () => ({
        sql: 'max(??)',
        values: ['b'],
      }),
    }).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `ra`, max(`b`)')

    query = qb.clear().select({
      a: 'ra',
      b: (builder) => { builder.max('b', 'maxb') },
    }).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `ra`, max(`b`) as `maxb`')

    query = qb.clear().select({
      a: 'ra',
      f() {
        this.max('b', 'maxb')
      },
    }).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `ra`, max(`b`) as `maxb`')
  })

  it('select(fields: { [tableName:string]: { [field:string]: string } })', () => {
    query = qb.clear().select({ a: {} }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.*')

    query = qb.clear().select({ a: { b: 'c', d: 'd' }, e: { f: 'g' } }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b` as `c`, `a`.`d` as `d`, `e`.`f` as `g`')

    query = qb.clear().select({ a: { b: '', d: 'd' } }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b`, `a`.`d` as `d`')

    query = qb.clear().select({ a: { b: 0, d: true } }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b`, `a`.`d`')

    query = qb.clear().select({ a: { b: {}, d: [] } }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b`, `a`.`d`')
  })

  des = 'select(fields: { '
    + '[tableName:string]: <string|boolean|number|<string|boolean|number>[]>[]'
    + ' })'
  it(des, () => {
    query = qb.clear().select({ t: [] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t`.*')

    query = qb.clear().select({ t: ['b', 'c'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t`.`b`, `t`.`c`')

    query = qb.clear().select({ t: [1, true] }).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({ t: [1, true, 'b'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t`.`b`')

    query = qb.clear().select({ t1: [['b', 'c'], 'd'], t2: ['a'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t1`.`b` as `c`, `t1`.`d`, `t2`.`a`')

    query = qb.clear().select({ t: [[1, true], 'b'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t`.`b`')

    query = qb.clear().select({ t1: [[1, 'd'], 'b'], t2: [1] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t1`.`b`')
  })

  des = 'select(fields: { [tableName:string]: { '
    + '[field:string]: (qb) => {sql: string, values: Array}|qb|void) |'
    + '<(qb) => {sql: string, values: Array}|qb|void)>[]'
    + '} })'
  it(des, () => {
    query = qb.clear().select({ t: { a: () => ({}) } }).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({
      t1: { a: 'ra' },
      t2: (builder, tableName) => ({
        sql: 'max(??.??)',
        values: [tableName, 'b'],
      }),
    }).toQuery();
    expect(mysql.format(...query)).toBe('select `t1`.`a` as `ra`, max(`t2`.`b`)')

    query = qb.clear().select({
      t1: { a: 't1a' },
      t2: {
        a: 't2a',
        b: (builder, tableName) => {
          builder.max([tableName, 'b'], 'maxb')
        },
      },
    }).toQuery();
    sql = 'select `t1`.`a` as `t1a`, `t2`.`a` as `t2a`, max(`t2`.`b`) as `maxb`'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().select({
      t1: { a: 't1a' },
      t2: [
        ['a', 't2a'],
        function (builder, tableName) {
          this.max([tableName, 'b'], 'maxb')
        },
      ],
    }).toQuery();
    sql = 'select `t1`.`a` as `t1a`, `t2`.`a` as `t2a`, max(`t2`.`b`) as `maxb`'
    expect(mysql.format(...query)).toBe(sql)
  })
})
