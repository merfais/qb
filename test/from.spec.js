const mysql = require('mysql')
const Builder = require('..')

describe('from', () => {
  let qb
  let query

  beforeEach(() => {
    qb = new Builder()
  })

  it('from(tableName:string, rename:string)', () => {
    query = qb.clear().from().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().from('t').toQuery();
    expect(mysql.format(...query)).toBe(' from `t`')

    query = qb.clear().from('t', 'r').toQuery();
    expect(mysql.format(...query)).toBe(' from `t` `r`')
  })

  it('select().from(tableName:string, rename:string)', () => {
    query = qb.clear().select({ a: '' }).from('t').toQuery();
    expect(mysql.format(...query)).toBe('select `a`.* from `t`')

    query = qb.clear().select({ r: ['a'] }).from('t', 'r').toQuery();
    expect(mysql.format(...query)).toBe('select `r`.`a` from `t` `r`')
  })
})

