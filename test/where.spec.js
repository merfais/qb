const mysql = require('mysql')
const Builder = require('..')

describe('join', () => {
  let qb
  let query
  let sql

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
    sql = " where `t`.`1` = 1 and `t`.`a` = 'av' and `t`.`c` = 1"
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
    sql = " where `t`.`a` in ('a', 'b', 1, true)"
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
    sql = " where `a` is 1 and `b` is NULL and `c` is not NULL"
      + " and `d` is not true and `e` is not 'true'"
    expect(mysql.format(...query)).toBe(sql)

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
    sql = " where `a` = 'a' and `b` > 1 and `c` < 0"
      + " and `d` != true and `e` <> 'true' and `f` >= 'null'"
      + " and `g` <= -1 and `h` <=> NULL"
    expect(mysql.format(...query)).toBe(sql)

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
    sql = " where `t`.`a` <= 10 and `t`.`b` > 1 and `t`.`c` like '%str%' and `t`.`d` is not NULL"
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
    sql = " where `t`.`a` like 'a%' and `t`.`a` is NULL"
      + " and `t`.`b` like '%b%' and `t`.`b` is not 'bbb'"
      + " and `t`.`c` not like '%c' and `t`.`c` not in ('ddd', 'fff')"
    expect(mysql.format(...query)).toBe(sql)
  })

  const des = 'where({[anyKey: string]: '
    + '<{[key:string]: string|number|boolean|{[op:string]: string|number|boolean}}>[]'
    + '}, tableName: string)'
  it(des, () => {
    query = qb.clear().where({ or: [{ a: 1 }, { b: 2 }], c: 3 }).toQuery()
    expect(mysql.format(...query)).toBe(" where (`a` = 1 or `b` = 2) and `c` = 3")

    query = qb.clear().where({ a: { is: null }, or: [{ b: 2 }] }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` is NULL and `b` = 2")

    query = qb.clear().where({
      a: { is: undefined },
      or1: [
        { b: { '<': 2, '>': 0 } },
        { b: [1,2] }
      ],
      or2: [
        { c: 1 },
        { d: { '<': 10 } },
        { e: '3', f: true, or: [{ g: { is: null } }, { g: { like: 'gg' } }] },
      ],
      h: 'str',
    }, 't').toQuery()
    sql = " where `t`.`a` is NULL "
      + "and ((`t`.`b` < 2 and `t`.`b` > 0) or `t`.`b` in (1, 2)) "
      + "and (`t`.`c` = 1 or `t`.`d` < 10 or ("
      + "`t`.`e` = '3' and `t`.`f` = true and (`t`.`g` is NULL or `t`.`g` like '%gg%')"
      + ")) "
      + "and `t`.`h` = 'str'"
    expect(mysql.format(...query)).toBe(sql)

    // illegal input
    query = qb.clear().where({
      or: [{ b: 2 }, 1, null, false],
      or2: [{ a: 1 }, { c: [] }, { d: {} }, {}, { e: null }],
    }, 't').toQuery()
    sql = " where `t`.`b` = 2 and (`t`.`a` = 1 or `t`.`e` = NULL)"
    expect(mysql.format(...query)).toBe(sql)
  })

  it('where({ [tableName: string]: Object)', () => {
    query = qb.clear().where({t: { a: { in: ['a', 'b'] } } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `t`.`a` in ('a', 'b')")

    query = qb.clear().where({ t: { a: { '>': 1, '<': 10 } } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `t`.`a` > 1 and `t`.`a` < 10")

    query = qb.clear().where({ t: { a: { '=': 1 }, b: { like: 'a' } } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `t`.`a` = 1 and `t`.`b` like '%a%'")

    query = qb.clear().where({ t1: { a: { '=': 1 } }, t2: { b: { like: 'a' } } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `t1`.`a` = 1 and `t2`.`b` like '%a%'")

    query = qb.clear().where({
      t1: { a: { 'like%': 'a', is: null } },
      t2: { b: { like: 'b', 'is not': 'bbb' } },
      t3: { c: { 'not %like': 'c', 'not in': ['ddd', 'fff'] } },
    }).toQuery()
    sql = " where `t1`.`a` like 'a%' and `t1`.`a` is NULL"
      + " and `t2`.`b` like '%b%' and `t2`.`b` is not 'bbb'"
      + " and `t3`.`c` not like '%c' and `t3`.`c` not in ('ddd', 'fff')"
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().where({
      t1: { a: { is: undefined } },
      or1: [
        { t1: { b: { '<': 2, '>': 0 } } },
        { t2: { b: [1,2] } },
      ],
      or2: [
        { t3: { c: 1 } },
        { t3: { d: { '<': 10 } } },
        {
          t3: { e: '3' },
          t4: { f: true },
          or: [
            { t4: { g: { is: null } } },
            { t4: { g: { like: 'gg' } } }
          ]
        },
      ],
      t5: { h: 'str' },
    }, 't').toQuery()
    sql = " where `t1`.`a` is NULL "
      + "and ((`t1`.`b` < 2 and `t1`.`b` > 0) or `t2`.`b` in (1, 2)) "
      + "and (`t3`.`c` = 1 or `t3`.`d` < 10 or ("
      + "`t3`.`e` = '3' and `t4`.`f` = true and (`t4`.`g` is NULL or `t4`.`g` like '%gg%')"
      + ")) "
      + "and `t5`.`h` = 'str'"
    expect(mysql.format(...query)).toBe(sql)
  })

  it('where(<object>[], tableName: string)', () => {
    query = qb.clear().where([
      { a: { '>': 0, '<': 10 } },
      { a: 15 },
      {
        c: { is: undefined },
        or1: [
          { b: { '<': 2, '>': 0 } },
          { b: [1,2] }
        ],
        or2: [
          { d: 20 },
          { d: { '<': 10 } },
          { e: '3', f: true, or: [{ g: { is: null } }, { g: { like: 'gg' } }] },
        ],
        h: 'str',
      },
    ]).toQuery()
    sql = " where (`a` > 0 and `a` < 10)"
      + " or `a` = 15"
      + " or ("
      + "`c` is NULL "
      + "and ((`b` < 2 and `b` > 0) or `b` in (1, 2)) "
      + "and (`d` = 20 or `d` < 10 or ("
      + "`e` = '3' and `f` = true and (`g` is NULL or `g` like '%gg%')"
      + ")) "
      + "and `h` = 'str'"
      + ")"
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().where([
      { t1: { a: { '>': 0, '<': 10 } } },
      { t1: { a: 15 } },
      {
        t2: { c: { is: undefined } },
        or1: [
          { t3 : { b: { '<': 2, '>': 0 } } },
          { t3: { b: [1,2] } },
        ],
        or2: [
          { t4: { d: 20 } },
          { t5: { d: { '<': 10 } } },
          {
            t6: { e: '3' },
            t7: { f: true },
            or: [
              { t7: { g: { is: null } } },
              { t8: { g: { like: 'gg' } } },
            ]
          },
        ],
        t9: { h: 'str' },
      },
    ]).toQuery()
    sql = " where (`t1`.`a` > 0 and `t1`.`a` < 10)"
      + " or `t1`.`a` = 15"
      + " or ("
      + "`t2`.`c` is NULL "
      + "and ((`t3`.`b` < 2 and `t3`.`b` > 0) or `t3`.`b` in (1, 2)) "
      + "and (`t4`.`d` = 20 or `t5`.`d` < 10 or ("
      + "`t6`.`e` = '3' and `t7`.`f` = true and (`t7`.`g` is NULL or `t8`.`g` like '%gg%')"
      + ")) "
      + "and `t9`.`h` = 'str'"
      + ")"
    expect(mysql.format(...query)).toBe(sql)
  })
})
