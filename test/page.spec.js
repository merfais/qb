const mysql = require('mysql')
const Builder = require('..')

describe('join', () => {
  let qb
  let query

  beforeEach(() => {
    qb = new Builder()
  })

  it('limit(size:number)', () => {
    query = qb.clear().limit(1).toQuery();
    expect(mysql.format(...query)).toBe(' limit 1')

    query = qb.clear().limit('1').toQuery();
    expect(mysql.format(...query)).toBe(' limit 1')

    // illegal input
    query = qb.clear().limit(0).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().limit(-1).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().limit(null).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().limit(undefined).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().limit('dd').toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().limit([]).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().limit({}).toQuery();
    expect(mysql.format(...query)).toBe('')
  })

  it('offset(size:number)', () => {
    query = qb.clear().offset(1).toQuery();
    expect(mysql.format(...query)).toBe(' offset 1')

    query = qb.clear().offset('1').toQuery();
    expect(mysql.format(...query)).toBe(' offset 1')

    // illegal input
    query = qb.clear().offset(0).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().offset(-1).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().offset(null).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().offset(undefined).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().offset('dd').toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().offset([]).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().offset({}).toQuery();
    expect(mysql.format(...query)).toBe('')
  })

  it('page(size: number, page: number)', () => {
    query = qb.clear().page(10).toQuery();
    expect(mysql.format(...query)).toBe(' limit 10')

    query = qb.clear().page('10').toQuery();
    expect(mysql.format(...query)).toBe(' limit 10')

    query = qb.clear().page(10, 1).toQuery();
    expect(mysql.format(...query)).toBe(' limit 10')

    query = qb.clear().page(10, 2).toQuery();
    expect(mysql.format(...query)).toBe(' limit 10 offset 10')

    query = qb.clear().page(10, '3').toQuery();
    expect(mysql.format(...query)).toBe(' limit 10 offset 20')

    query = qb.clear().page(10, -1).toQuery();
    expect(mysql.format(...query)).toBe(' limit 10')

    query = qb.clear().page(10, 0).toQuery();
    expect(mysql.format(...query)).toBe(' limit 10')

    query = qb.clear().page(10, null).toQuery();
    expect(mysql.format(...query)).toBe(' limit 10')

    query = qb.clear().page(10, undefined).toQuery();
    expect(mysql.format(...query)).toBe(' limit 10')

    query = qb.clear().page(10, '').toQuery();
    expect(mysql.format(...query)).toBe(' limit 10')

    // illegal input
    query = qb.clear().page(0).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().page(-1).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().page(null).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().page(undefined).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().page('').toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().page({}).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().page([]).toQuery();
    expect(mysql.format(...query)).toBe('')
  })
})

