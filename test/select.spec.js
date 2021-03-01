const mysql = require('mysql')
const Builder = require('..')

describe('select', () => {
  let qb
  let query

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

  it('select(fields: { [tableName:string]: <string|boolean|number|<string|boolean|number>[]>[] })', () => {
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

    query = qb.clear().select({ t: [[1, true], 'b'], }).toQuery();
    expect(mysql.format(...query)).toBe('select `t`.`b`')

    query = qb.clear().select({ t1: [[1, 'd'], 'b'], t2: [1] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t1`.`b`')
  })

  it('select(fields: (queryBuilder) => { sql: string, values: Array } | queryBuilder | void)', () => {
    query = qb.clear().select((q) => { q.count() }).toQuery();
    expect(mysql.format(...query)).toBe('select count(*)')

    query = qb.clear().select(function () { this.max('f1') }).toQuery();
    expect(mysql.format(...query)).toBe('select max(`f1`)')

    query = qb.clear().select((builder) => {
      builder.sum('f1', 'f1')
      return builder
    }).toQuery();
    expect(mysql.format(...query)).toBe('select sum(`f1`) as `f1`')

    query = qb.clear().select((builder) => {
      builder.count('count')
      return { sql: builder.sql, values: builder.values }
    }).toQuery();
    expect(mysql.format(...query)).toBe('select count(*) as `count`')

    query = qb.clear().select(() => ({
      sql: '??, avg(??) as ??',
      values: ['name', 'score', 'score']
    })).toQuery();
    expect(mysql.format(...query)).toBe('select `name`, avg(`score`) as `score`')
  })
})
