const mysql = require('mysql')
const Builder = require('..')

describe('sub', () => {
  let qb
  let query
  let sql

  beforeEach(() => {
    qb = new Builder()
  })

  it('sub(fn: (queryBuilder) => { sql: string, values: Array } | queryBuilder | void)', () => {
    query = qb.clear()
      .select('f1')
      .from('t1')
      .padEnd(' where ?? in (', ['f2'])
      .sub((builder) => builder.select('f3').from('t2'))
      .padEnd(')')
      .toQuery()
    sql = 'select `f1` from `t1` where `f2` in (select `f3` from `t2`)'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear()
      .select('f1')
      .from('t1')
      .padEnd(' where ?? in (', ['f2'])
      .sub(function () {
        this.select('f3')
          .padEnd(' as ?? from ??)')
          .padEnd(['r3', 't2'])
      })
      .toQuery()
    sql = 'select `f1` from `t1` where `f2` in (select `f3` as `r3` from `t2`)'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear()
      .select('f1')
      .from('t1')
      .padEnd(' where ?? in (', ['f2'])
      .sub(() => ({
        sql: 'select ?? from ??',
        values: ['f3', 't2'],
      }))
      .padEnd(')')
      .toQuery()
    sql = 'select `f1` from `t1` where `f2` in (select `f3` from `t2`)'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear()
      .select('f1')
      .from('t1')
      .padEnd()
      .sub(() => ({
        str: 'select ?? from ??',
        valueArr: ['f3', 't2'],
      }))
      .padEnd()
      .toQuery()
    sql = 'select `f1` from `t1`'
    expect(mysql.format(...query)).toBe(sql)
  })
})
