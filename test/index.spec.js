const mysql = require('mysql')
const Builder = require('..')

describe('index', () => {
  let qb
  let query
  let sql

  beforeEach(() => {
    qb = new Builder()
    sql = ''
  })

  it('select', () => {
    query = qb
      .select({ t1: { f1: 'f1', f2: 'f2' }, t2: '' })
      .from('t1')
      .innerJoin('t2', { t1_f2: 'f1' })
      .where({ t1: { id: 1 }, t2: {f1 :{ '>': 1 } } })
      .order({ f1: 'desc', f2: '' })
      .limit(10)
      .offset(10)
      .toQuery();
    sql = 'select `t1`.`f1` as `f1`, `t1`.`f2` as `f2`, `t2`.* from `t1` '
      + 'inner join `t2` on `t2`.`t1_f2` = `t1`.`f1` '
      + 'where `t1`.`id` = 1 and `t2`.`f1` > 1 '
      + 'order by `f1` desc, `f2` '
      + 'limit 10 offset 10'
    expect(mysql.format(...query)).toBe(sql)
  })

  it('insert', () => {
    query = qb
      .insert('t1', { f1: 'str1', f2: 'str2' })
      .toQuery();
    sql = "insert into `t1` set `f1` = 'str1', `f2` = 'str2'"
    expect(mysql.format(...query)).toBe(sql)
  })

  it('update', () => {
    query = qb
      .update('t1', { f1: 'str1', f2: 'str2' }, { id: 1 })
      .toQuery();
    sql = "update `t1` set `f1` = 'str1', `f2` = 'str2' where `id` = 1"
    expect(mysql.format(...query)).toBe(sql)

  })

  it('delete', () => {
    query = qb
      .delete('t1', { id: { '<': 10 } })
      .toQuery();
    sql = "delete from `t1` where `id` < 10"
    expect(mysql.format(...query)).toBe(sql)

  })

  it('multiple statement', () => {
    query = qb
      .update('t1', { f1: 'str1', f2: 'str2' }, { id: 1 })
      .select()
      .from('t1')
      .where({ id: 1 })
      .toQuery();
    sql = "update `t1` set `f1` = 'str1', `f2` = 'str2' where `id` = 1;"
      + 'select * from `t1` where `id` = 1'
    expect(mysql.format(...query)).toBe(sql)

    query = qb
      .clear()
      .select()
      .from('t1')
      .where({ a: 'str' })
      .page(10, 2)
      .select()
      .from('t1')
      .where({ a: 'str' })
      .toQuery();
    sql = "select * from `t1` where `a` = 'str' limit 10 offset 10;"
      + "select * from `t1` where `a` = 'str'"
    expect(mysql.format(...query)).toBe(sql)

    query = qb
      .clear()
      .select('f1').from('t0')
      .insert('t1', { a: 1 })
      .update('t2', { b: 2 }, { id: 2 })
      .delete('t3', { id: 3 })
      .toQuery()
    sql = 'select `f1` from `t0`;'
      + 'insert into `t1` set `a` = 1;'
      + 'update `t2` set `b` = 2 where `id` = 2;'
      + 'delete from `t3` where `id` = 3'
    expect(mysql.format(...query)).toBe(sql)
  })
})


