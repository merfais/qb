const mysql = require('mysql')
const Builder = require('..')

describe('insert', () => {
  let qb
  let query
  let sql

  beforeEach(() => {
    qb = new Builder()
  })

  it('insert(tableName: string, data: {[key]: string|number|boolean})', () => {
    query = qb.clear().insert().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().insert('t', {}).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().insert('t', { a: null }).toQuery();
    expect(mysql.format(...query)).toBe('insert into `t` set `a` = NULL')

    query = qb.clear().insert('t', { a: 1, b: '2', c: true }).toQuery();
    expect(mysql.format(...query)).toBe("insert into `t` set `a` = 1, `b` = '2', `c` = true")

    // illegal input
    query = qb.clear().insert('t', null).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().insert('t', undefined).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().insert('t', 1).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().insert('t', true).toQuery();
    expect(mysql.format(...query)).toBe('')
  })

  it('insert(tableName: string, data: <{[key]: string|number|boolean}>[])', () => {
    query = qb.clear().insert('t', []).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().insert('t', [{}]).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().insert('t', [{ a: 1, b: '2' }]).toQuery();
    expect(mysql.format(...query)).toBe("insert into `t` set `a` = 1, `b` = '2'")

    query = qb.clear().insert('t', [{ a: true, b: null }, {}]).toQuery();
    expect(mysql.format(...query)).toBe('insert into `t` set `a` = true, `b` = NULL')

    query = qb.clear().insert('t', [{ a: 1, b: 'b' }, { a: 2, b: 'b' }]).toQuery();
    expect(mysql.format(...query)).toBe("insert into `t` (`a`, `b`) values (1, 'b'), (2, 'b')")

    query = qb.clear().insert('t', [
      { b: 2, c: 3 },
      { a: 2, b: 3 },
      { b: 3, c: 4, d: 5 },
    ]).toQuery();
    sql = 'insert into `t` (`b`, `c`, `a`, `d`) values '
      + '(2, 3, NULL, NULL), (3, NULL, 2, NULL), (3, 4, NULL, 5)'
    expect(mysql.format(...query)).toBe(sql)

    // illegal input
    query = qb.clear().insert('t', [null, undefined]).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().insert('t', [1, 2]).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().insert('t', [true, 'string']).toQuery();
    expect(mysql.format(...query)).toBe('')
  })
})
