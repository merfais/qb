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
    expect(mysql.format(...query)).toBe(' where `a` = NULL')

    query = qb.clear().where({ a: undefined }).toQuery();
    expect(mysql.format(...query)).toBe(' where `a` = NULL')

    query = qb.clear().where({
      a: 'av',
      c: 1,
      d: true,
      f: null,
      true: 1,
      1: 1,
    }, 't').toQuery()
    const sql = " where `t`.`1` = 1 and `t`.`a` = 'av' and `t`.`c` = 1"
      + " and `t`.`d` = true and `t`.`f` = NULL and `t`.`true` = 1"
    expect(mysql.format(...query)).toBe(sql)
  })

  it('where({ [key: string]: <string|boolean|number>[] }, tableName: string)', () => {
    query = qb.clear().where({ a: [] }).toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where({ a: ['a', 'b', 1, true] }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` in ('a', 'b', 1, true)")

    query = qb.clear().where({
      a: ['a', 'b', 1, true],
      b: ['a', 'b', 1, true],
      c: [],
    }, 't').toQuery()
    const sql = " where `t`.`a` in ('a', 'b', 1, true)"
      + " and `t`.`b` in ('a', 'b', 1, true)"
    expect(mysql.format(...query)).toBe(sql)
  })

  it('where({ [key: string]: { operator: string, value: string } }, tableName: string)', () => {
    query = qb.clear().where({ a: {} }).toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where({ a: { operator: 'in', value: ['a', 'b']} }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` in ('a', 'b')")

    query = qb.clear().where({ a: { operator: 'not in', value: [true, 1]} }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` not in (true, 1)")

    query = qb.clear().where({
      a: { operator: 'is', value: 1 },
      b: { operator: 'is', value: null },
      c: { operator: 'is not', value: undefined },
      d: { operator: 'is not', value: true },
      e: { operator: 'is not', value: 'true' },
    }).toQuery()
    const sql0 = " where `a` is 1 and `b` is NULL and `c` is not NULL"
      + " and `d` is not true and `e` is not 'true'"
    expect(mysql.format(...query)).toBe(sql0)

    query = qb.clear().where({
      a: { operator: '=', value: 'a' },
      b: { operator: '>', value: 1 },
      c: { operator: '<', value: 0 },
      d: { operator: '!=', value: true },
      e: { operator: '<>', value: 'true' },
      f: { operator: '>=', value: 'null' },
      g: { operator: '<=', value: -1 },
      h: { operator: '<=>', value: undefined },
    }).toQuery()
    const sql1 = " where `a` = 'a' and `b` > 1 and `c` < 0"
      + " and `d` != true and `e` <> 'true' and `f` >= 'null'"
      + " and `g` <= -1 and `h` <=> NULL"
    expect(mysql.format(...query)).toBe(sql1)

    query = qb.clear().where({ a: { operator: 'not like', value: 'b' } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` not like '%b%'")

    query = qb.clear().where({ a: { operator: 'like', value: 'b', prefix: true } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` like '%b'")

    query = qb.clear().where({ a: { operator: 'like', value: 'b',suffix: true } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` like 'b%'")

    query = qb.clear().where({
      a: { operator: '<=', value: 10 },
      b: { operator: '>', value: 1 },
      c: { operator: 'like', value: 'str' },
      d: { operator: 'is not', value: null },
    }, 't').toQuery()
    const sql = " where `t`.`a` <= 10 and `t`.`b` > 1 and `t`.`c` like '%str%' and `t`.`d` is not NULL"
    expect(mysql.format(...query)).toBe(sql)
  })

  it('where({ [key: string]: { [op:string]: string|number|boolean } }, tableName: string)', () => {
    query = qb.clear().where({ a: { in: ['a', 'b'] } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` in ('a', 'b')")

    query = qb.clear().where({ a: { '>': 1, '<': 10 } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` > 1 and `a` < 10")

    query = qb.clear().where({ a: { '=': 1 }, b: { like: 'a' } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` = 1 and `b` like '%a%'")

    query = qb.clear().where({ a: { '>=': 1, '<=': 10 } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` >= 1 and `a` <= 10")

    query = qb.clear().where({ a: { '<>': 1, '!=': 10 } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` <> 1 and `a` != 10")

    query = qb.clear().where({
      a: { 'like%': 'a', is: null },
      b: { like: 'b', 'is not': 'bbb' },
      c: { 'not %like': 'c', 'not in': ['ddd', 'fff'] },
    }, 't').toQuery()
    const sql = " where `t`.`a` like 'a%' and `t`.`a` is NULL"
      + " and `t`.`b` like '%b%' and `t`.`b` is not 'bbb'"
      + " and `t`.`c` not like '%c' and `t`.`c` not in ('ddd', 'fff')"
    expect(mysql.format(...query)).toBe(sql)
  })
})
