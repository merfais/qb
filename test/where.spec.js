const mysql = require('mysql')
const Builder = require('..')

describe('join', () => {
  let qb
  let query

  beforeEach(() => {
    qb = new Builder()
  })

  it('where({ [key: string]: string|boolean|number }, tableName: string)', () => {
    query = qb.clear().where().toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where({}).toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where({ a: 'a' }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` = 'a'")

    query = qb.clear().where({ a: 1, b: 'b', c: true }).toQuery();
    expect(mysql.format(...query)).toBe(" where `a` = 1 and `b` = 'b' and `c` = true")

    query = qb.clear().where({ a: null }).toQuery();
    expect(mysql.format(...query)).toBe(" where `a` = NULL")

    query = qb.clear().where({ a: undefined }).toQuery();
    expect(mysql.format(...query)).toBe(" where `a` = NULL")

    query = qb.clear().where({ a: 'av', b: 'bv' }, 't').toQuery()
    expect(mysql.format(...query)).toBe(" where `t`.`a` = 'av' and `t`.`b` = 'bv'")
  })

  it('where({ [key: string]: string|boolean|number[] }, tableName: string)', () => {
    query = qb.clear().where({ a: [] }).toQuery()
    expect(mysql.format(...query)).toBe("")

    query = qb.clear().where({ a: ['a'] }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` in ('a')")


  })
})
