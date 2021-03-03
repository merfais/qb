const mysql = require('mysql')
const Builder = require('..')

describe('delete', () => {
  let qb
  let query
  let sql

  beforeEach(() => {
    qb = new Builder()
  })

  it('delete(tableName: string, where?: Array|Object)', () => {
    query = qb.clear().delete().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().delete('').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().delete('t').toQuery();
    expect(mysql.format(...query)).toBe('delete from `t`')

    query = qb.clear().delete('t', { id: 1 }).toQuery();
    expect(mysql.format(...query)).toBe('delete from `t` where `id` = 1')

    query = qb.clear().delete('t', [{ id: 1 }, { f: 2 }]).toQuery();
    sql = 'delete from `t` where `id` = 1 or `f` = 2'
    expect(mysql.format(...query)).toBe(sql)

    // illegal input
    query = qb.clear().delete(1).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().delete(null).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().delete(true).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().delete([]).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().delete({}).toQuery();
    expect(mysql.format(...query)).toBe('')
  })
})

