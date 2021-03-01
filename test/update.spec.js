const mysql = require('mysql')
const Builder = require('..')

describe('update', () => {
  let qb
  let query

  beforeEach(() => {
    qb = new Builder()
  })

  it('update(tableName: string, data: {[key]: string|number|boolean}, where?: Array|Object)', () => {
    query = qb.clear().update().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().update('t').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().update('t', {}).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().update('t', { a: 1}).toQuery();
    expect(mysql.format(...query)).toBe('update `t` set `a` = 1')

    query = qb.clear().update('t', { a: true, b: 'str', c: null }).toQuery();
    expect(mysql.format(...query)).toBe("update `t` set `a` = true, `b` = 'str', `c` = NULL")

    query = qb.clear().update('t', { a: 1}, {id: 1}).toQuery();
    expect(mysql.format(...query)).toBe('update `t` set `a` = 1 where `id` = 1')

    query = qb.clear().update('t', { a: true, b: 'str', c: null }, [{id: 1}, {f: 2}]).toQuery();
    sql = "update `t` set `a` = true, `b` = 'str', `c` = NULL where `id` = 1 or `f` = 2"
    expect(mysql.format(...query)).toBe(sql)

    // illegal input
    query = qb.clear().update('t', []).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().update('t', null).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().update('t', 1).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().update('t', 'string').toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().update('t', undefined).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().update('t', true).toQuery();
    expect(mysql.format(...query)).toBe('')
  })
})

