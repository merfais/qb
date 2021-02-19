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

    query = qb.clear().select(' a ').toQuery();
    expect(mysql.format(...query)).toBe('select ` a `')

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

    query = qb.clear().select([' a ', true]).toQuery();
    expect(mysql.format(...query)).toBe('select ` a `, true')

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

  it('select(fields: { [key:string]: { [field:string]: string } })', () => {
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

  it('select(fields: { [key:string]: <string|boolean|number|<string|boolean|number>[]>[] })', () => {
    query = qb.clear().select({ a: [] }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.*')

    query = qb.clear().select({ a: ['b', 'c'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b`, `a`.`c`')

    query = qb.clear().select({ a: [1, true] }).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({ a: [1, true, 'b'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b`')

    query = qb.clear().select({ a: [['b', 'c'], 'd'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b` as `c`, `a`.`d`')

    query = qb.clear().select({ a: [[1, true], 'b'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b`')

    query = qb.clear().select({ a: [[1, 'd'], 'b'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b`')
  })
})
