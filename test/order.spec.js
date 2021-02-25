const mysql = require('mysql')
const Builder = require('..')

describe('order', () => {
  let qb
  let query

  beforeEach(() => {
    qb = new Builder()
  })

  it('order(sort:string)', () => {
    query = qb.clear().order().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().order('').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().order('a').toQuery();
    expect(mysql.format(...query)).toBe(' order by `a`')

    query = qb.clear().order(' a ').toQuery();
    expect(mysql.format(...query)).toBe(' order by `a`')

    query = qb.clear().order('a desc').toQuery();
    expect(mysql.format(...query)).toBe(' order by `a` desc')

    query = qb.clear().order('a DESC').toQuery();
    expect(mysql.format(...query)).toBe(' order by `a` DESC')

    query = qb.clear().order('a DesC').toQuery();
    expect(mysql.format(...query)).toBe(' order by `a` DesC')

    query = qb.clear().order('a asC b').toQuery();
    expect(mysql.format(...query)).toBe(' order by `a` asC')

    query = qb.clear().order('a asc b desc').toQuery();
    expect(mysql.format(...query)).toBe(' order by `a` asc')

  })

  it('order(sort:{ [field:string]: string })', () => {
    query = qb.clear().order({}).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().order({ a: 'desc' }).toQuery();
    expect(mysql.format(...query)).toBe(' order by `a` desc')

    query = qb.clear().order({ a: 'ASC', b: 'Desc' }).toQuery();
    expect(mysql.format(...query)).toBe(' order by `a` ASC, `b` Desc')

    query = qb.clear().order({ a: '', b: 'desc' }).toQuery();
    expect(mysql.format(...query)).toBe(' order by `a`, `b` desc')

    query = qb.clear().order({ a: true, b: 1 }).toQuery();
    expect(mysql.format(...query)).toBe(' order by `a`, `b`')

    query = qb.clear().order({ a: null, b: undefined }).toQuery();
    expect(mysql.format(...query)).toBe(' order by `a`, `b`')

    query = qb.clear().order({ a: [], b: {} }).toQuery();
    expect(mysql.format(...query)).toBe(' order by `a`, `b`')

    // illegal input
    query = qb.clear().order(null).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().order(undefined).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().order([]).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().order(1).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().order(true).toQuery();
    expect(mysql.format(...query)).toBe('')
  })
})
