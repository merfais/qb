# mysql-query-builder

mysql query build tools

## install

```Shell
npm i -S mysql-query-builder
```
## usage

+ [select](#select)
+ [from](#from)
+ [join](#join)
+ [where](#where)
+ [order](#order)
+ [limit offset page](#limit-offset-page)
+ [group by](#group-by)
+ [insert](#insert)
+ [update](#update)
+ [delete](#delete)
+ [sub padEnd](#sub-padEnd)
+ [count max min avg sum](#count-max-min-avg-sum)

```JavaScript
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
      .where({ t1: { id: 1 }, t2: { f1: { '>': 1 } } })
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
    sql = 'delete from `t1` where `id` < 10'
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
      .select((builder) => { builder.count('count') })
      .from('t1')
      .where({ a: 'str' })
      .toQuery();
    sql = "select * from `t1` where `a` = 'str' limit 10 offset 10;"
      + "select count(*) as `count` from `t1` where `a` = 'str'"
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

```

### select

```JavaScript
describe('select', () => {
  let qb
  let query
  let sql
  let des

  beforeEach(() => {
    qb = new Builder()
  })

  it('select()', () => {
    query = qb.clear().select().toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select(null).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select(undefined).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select('').toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({}).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select([]).toQuery();
    expect(mysql.format(...query)).toBe('select *')
  })

  it('select(fields: string|number|boolean)', () => {
    query = qb.clear().select('a').toQuery();
    expect(mysql.format(...query)).toBe('select `a`')

    query = qb.clear().select('a').toQuery();
    expect(mysql.format(...query)).toBe('select `a`')

    query = qb.clear().select('    ').toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select(1).toQuery();
    expect(mysql.format(...query)).toBe('select 1')

    query = qb.clear().select(true).toQuery();
    expect(mysql.format(...query)).toBe('select true')
  })

  it('select(fields: (qb) => {sql: string, values: Array}|qb|void)', () => {
    query = qb.clear().select(() => ({})).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select(() => ({
      sql: 'count(*) as ??',
      values: ['count'],
    })).toQuery();
    expect(mysql.format(...query)).toBe('select count(*) as `count`')

    query = qb.clear().select((builder) => builder.count('count')).toQuery();
    expect(mysql.format(...query)).toBe('select count(*) as `count`')

    query = qb.clear().select(function () { this.count('count') }).toQuery();
    expect(mysql.format(...query)).toBe('select count(*) as `count`')
  })

  it('select(fields: <string|boolean|number|<string|boolean|number>[]>[])', () => {
    query = qb.clear().select(['a', 'b']).toQuery();
    expect(mysql.format(...query)).toBe('select `a`, `b`')

    query = qb.clear().select([1, true]).toQuery();
    expect(mysql.format(...query)).toBe('select 1, true')

    query = qb.clear().select(['a', '']).toQuery();
    expect(mysql.format(...query)).toBe('select `a`')

    // illegal input
    query = qb.clear().select([1, '  ']).toQuery();
    expect(mysql.format(...query)).toBe('select 1')

    query = qb.clear().select(['a', true]).toQuery();
    expect(mysql.format(...query)).toBe('select `a`, true')

    query = qb.clear().select([['a', 'b'], 'c']).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `b`, `c`')

    query = qb.clear().select([[1, 'true'], [true, '1']]).toQuery();
    expect(mysql.format(...query)).toBe('select 1 as `true`, true as `1`')

    // illegal input
    query = qb.clear().select([[1, true], [true, 1]]).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    // illegal input
    query = qb.clear().select([['a'], ['a', ''], [' ', 'a'], []]).toQuery();
    expect(mysql.format(...query)).toBe('select *')
  })

  it('select(fields: <(qb) => {sql: string, values: Array}|qb|void>[])', () => {
    query = qb.clear().select(['a', () => ({})]).toQuery();
    expect(mysql.format(...query)).toBe('select `a`')

    query = qb.clear().select(['a', () => ({
      sql: 'max(??)',
      values: ['b'],
    })]).toQuery();
    expect(mysql.format(...query)).toBe('select `a`, max(`b`)')

    query = qb.clear().select(['a', (builder) => {
      builder.max('b', 'maxb')
    }]).toQuery();
    expect(mysql.format(...query)).toBe('select `a`, max(`b`) as `maxb`')

    query = qb.clear().select(['a', function (builder, tableName) {
      this.max([tableName, 'b'], 'maxb')
    }], 't').toQuery();
    expect(mysql.format(...query)).toBe('select `t`.`a`, max(`t`.`b`) as `maxb`')
  })

  it('select(fields: { [key:string]: string })', () => {
    query = qb.clear().select({ a: '' }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.*')

    query = qb.clear().select({ a: 'b' }).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `b`')

    // illegal input
    query = qb.clear().select({ a: 1 }).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    // illegal input
    query = qb.clear().select({ a: true }).toQuery()
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({ a: 'b', c: 1 }).toQuery()
    expect(mysql.format(...query)).toBe('select `a` as `b`')
  })

  it('select(fields: { [key]: string : (qb) => {sql: string, values: Array}|qb|void)', () => {
    query = qb.clear().select({ a: () => ({}) }).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({
      a: 'ra',
      b: () => ({
        sql: 'max(??)',
        values: ['b'],
      }),
    }).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `ra`, max(`b`)')

    query = qb.clear().select({
      a: 'ra',
      b: (builder) => { builder.max('b', 'maxb') },
    }).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `ra`, max(`b`) as `maxb`')

    query = qb.clear().select({
      a: 'ra',
      f() {
        this.max('b', 'maxb')
      },
    }).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `ra`, max(`b`) as `maxb`')
  })

  it('select(fields: { [tableName:string]: { [field:string]: string } })', () => {
    query = qb.clear().select({ a: {} }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.*')

    query = qb.clear().select({ a: { b: 'c', d: 'd' }, e: { f: 'g' } }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b` as `c`, `a`.`d` as `d`, `e`.`f` as `g`')

    query = qb.clear().select({ a: { b: '', d: 'd' } }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b`, `a`.`d` as `d`')

    query = qb.clear().select({ a: { b: 0, d: true } }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b`, `a`.`d`')

    query = qb.clear().select({ a: { b: {}, d: [] } }).toQuery();
    expect(mysql.format(...query)).toBe('select `a`.`b`, `a`.`d`')
  })

  des = 'select(fields: { '
    + '[tableName:string]: <string|boolean|number|<string|boolean|number>[]>[]'
    + ' })'
  it(des, () => {
    query = qb.clear().select({ t: [] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t`.*')

    query = qb.clear().select({ t: ['b', 'c'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t`.`b`, `t`.`c`')

    query = qb.clear().select({ t: [1, true] }).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({ t: [1, true, 'b'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t`.`b`')

    query = qb.clear().select({ t1: [['b', 'c'], 'd'], t2: ['a'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t1`.`b` as `c`, `t1`.`d`, `t2`.`a`')

    query = qb.clear().select({ t: [[1, true], 'b'] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t`.`b`')

    query = qb.clear().select({ t1: [[1, 'd'], 'b'], t2: [1] }).toQuery();
    expect(mysql.format(...query)).toBe('select `t1`.`b`')
  })

  des = 'select(fields: { [tableName:string]: { '
    + '[field:string]: (qb) => {sql: string, values: Array}|qb|void) |'
    + '<(qb) => {sql: string, values: Array}|qb|void)>[]'
    + '} })'
  it(des, () => {
    query = qb.clear().select({ t: { a: () => ({}) } }).toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select({
      t1: { a: 'ra' },
      t2: (builder, tableName) => ({
        sql: 'max(??.??)',
        values: [tableName, 'b'],
      }),
    }).toQuery();
    expect(mysql.format(...query)).toBe('select `t1`.`a` as `ra`, max(`t2`.`b`)')

    query = qb.clear().select({
      t1: { a: 't1a' },
      t2: {
        a: 't2a',
        b: (builder, tableName) => {
          builder.max([tableName, 'b'], 'maxb')
        },
      },
    }).toQuery();
    sql = 'select `t1`.`a` as `t1a`, `t2`.`a` as `t2a`, max(`t2`.`b`) as `maxb`'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().select({
      t1: { a: 't1a' },
      t2: [
        ['a', 't2a'],
        function (builder, tableName) {
          this.max([tableName, 'b'], 'maxb')
        },
      ],
    }).toQuery();
    sql = 'select `t1`.`a` as `t1a`, `t2`.`a` as `t2a`, max(`t2`.`b`) as `maxb`'
    expect(mysql.format(...query)).toBe(sql)
  })
})
```
### from

```JavaScript
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
```

### join

```JavaScript
describe('join', () => {
  let qb
  let query

  beforeEach(() => {
    qb = new Builder()
  })

  it('join(target:string, source:string, mapping:{ [key:string]:string }, prefix: string)', () => {
    query = qb.clear().join().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().join('t2').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().join('t2', {}).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().join('t2', {}, 't1').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().join('t2', { id: 't2_id' }, 't1').toQuery();
    expect(mysql.format(...query)).toBe(' join `t2` on `t2`.`id` = `t1`.`t2_id`')

    query = qb.clear().join('t2', { id: 't2_id' }, 't1', 'inner').toQuery();
    expect(mysql.format(...query)).toBe(' inner join `t2` on `t2`.`id` = `t1`.`t2_id`')
  })

  it('join(obj: { target:string, source:string, mapping:{ [key:string]:string } }, prefix: string)', () => {
    query = qb.clear().join({}).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().join({ target: 't2' }).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().join({ target: 't2', source: 't1' }).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().join({ target: 't2', source: 't1', mapping: {} }).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().join({ target: 't2', source: 't1', mapping: { id: 't2_id' } }).toQuery();
    expect(mysql.format(...query)).toBe(' join `t2` on `t2`.`id` = `t1`.`t2_id`')

    query = qb.clear().join({ target: 't2', source: 't1', mapping: { id: 't2_id' } }, 'inner').toQuery();
    expect(mysql.format(...query)).toBe(' inner join `t2` on `t2`.`id` = `t1`.`t2_id`')
  })

  it('from(table: string).join(target:string, mapping:{ [key:string]:string } }, prefix: string)', () => {
    query = qb.clear().from('t1').join('t2', { id: 't2_id' }).toQuery();
    expect(mysql.format(...query)).toBe(' from `t1` join `t2` on `t2`.`id` = `t1`.`t2_id`')

    query = qb.clear().from('').join('t2', { id: 't2_id' }).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().from('t1')
      .join({ target: 't2', mapping: { id: 't2_id' } }, 'inner')
      .join('t3', { id: 't3_id' }, 't2', 'inner')
      .toQuery();
    const str = ' from `t1` inner join `t2` on `t2`.`id` = `t1`.`t2_id` '
      + 'inner join `t3` on `t3`.`id` = `t2`.`t3_id`'
    expect(mysql.format(...query)).toBe(str)
  })

  it('left|right|inner|outer|cross join', () => {
    query = qb.clear().from('t1')
      .innerJoin('t2', { id: 't2_id' })
      .leftJoin('t3', { id: 't3_id' }, 't2')
      .rightJoin({ target: 't4', mapping: { id: 't4_id' }, source: 't2' })
      .crossJoin('t5', { id: 't5_id' }, 't3')
      .outerJoin({ target: 't6', mapping: { id: 't6_id' } })
      .toQuery();
    const str = ' from `t1` '
      + 'inner join `t2` on `t2`.`id` = `t1`.`t2_id` '
      + 'left join `t3` on `t3`.`id` = `t2`.`t3_id` '
      + 'right join `t4` on `t4`.`id` = `t2`.`t4_id` '
      + 'cross join `t5` on `t5`.`id` = `t3`.`t5_id` '
      + 'outer join `t6` on `t6`.`id` = `t1`.`t6_id`'
    expect(mysql.format(...query)).toBe(str)
  })
})
```

### where

```JavaScript
describe('where', () => {
  let qb
  let query
  let sql
  let des

  beforeEach(() => {
    qb = new Builder()
  })

  it('where(condition: string|number|boolean|null|undefined)', () => {
    query = qb.clear().where().toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where('').toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where('  ').toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where('1').toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where(1).toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where(true).toQuery()
    expect(mysql.format(...query)).toBe('')
  })

  it('where({ [key: string]: string|boolean|number }, tableName: string)', () => {
    query = qb.clear().where({}).toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where({ a: 'a' }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` = 'a'")

    query = qb.clear().where({ a: 1, b: 'b', c: true }).toQuery();
    expect(mysql.format(...query)).toBe(" where `a` = 1 and `b` = 'b' and `c` = true")

    query = qb.clear().where({ a: null, b: undefined }).toQuery();
    expect(mysql.format(...query)).toBe(' where `a` = NULL and `b` = NULL')

    query = qb.clear().where({ a: '   ', b: false }).toQuery();
    expect(mysql.format(...query)).toBe(' where `b` = false')

    query = qb.clear().where({
      a: 'av',
      c: 1,
      d: true,
      f: null,
      true: 1,
      1: 1,
    }, 't').toQuery()
    sql = " where `t`.`1` = 1 and `t`.`a` = 'av' and `t`.`c` = 1"
      + ' and `t`.`d` = true and `t`.`f` = NULL and `t`.`true` = 1'
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

  it('where({ [key: string]: (qb) => {sql: string, values: Array}|qb|void }, tableName: string)', () => {
    query = qb.clear().where({ a: () => {} }).toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where({
      a: () => ({
        sql: 'select ?? from ?? where ?? = ?',
        values: ['f1', 't', 'f2', 1],
      }),
    }).toQuery()
    sql = ' where `a` = (select `f1` from `t` where `f2` = 1)'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().where({
      a: (builder) => {
        builder.select('f1').from('t').where({ f2: 1 })
      },
    }).toQuery()
    sql = ' where `a` = (select `f1` from `t` where `f2` = 1)'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().where({
      a() {
        this.select('f1').from('t').where({ f2: 1 })
      },
    }).toQuery()
    sql = ' where `a` = (select `f1` from `t` where `f2` = 1)'
    expect(mysql.format(...query)).toBe(sql)
  })

  it('where({ [key: string]: { operator: string, value: string } }, tableName: string)', () => {
    query = qb.clear().where({ a: {} }).toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where({ a: { operator: 'in', value: ['a', 'b'] } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` in ('a', 'b')")

    query = qb.clear().where({ a: { operator: 'not in', value: [true, 1] } }).toQuery()
    expect(mysql.format(...query)).toBe(' where `a` not in (true, 1)')

    query = qb.clear().where({
      a: { operator: 'is', value: 1 },
      b: { operator: 'is', value: null },
      c: { operator: 'is not', value: undefined },
      d: { operator: 'is not', value: true },
      e: { operator: 'is not', value: 'true' },
      f: { operator: 'illegal', value: '' },
    }).toQuery()
    sql = ' where `a` is 1 and `b` is NULL and `c` is not NULL'
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
      + ' and `g` <= -1 and `h` <=> NULL'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().where({ a: { operator: 'not like', value: 'b' } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` not like '%b%'")

    query = qb.clear().where({ a: { operator: 'like', value: 'b', prefix: true } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` like '%b'")

    query = qb.clear().where({ a: { operator: 'like', value: 'b', suffix: true } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` like 'b%'")

    query = qb.clear().where({
      a: { operator: '<=', value: 10 },
      b: { operator: '>', value: 1 },
      c: { operator: 'like', value: 'str' },
      d: { operator: 'is not', value: null },
    }, 't').toQuery()
    sql = " where `t`.`a` <= 10 and `t`.`b` > 1 and `t`.`c` like '%str%' and `t`.`d` is not NULL"
    expect(mysql.format(...query)).toBe(sql)

    // illegal input
    query = qb.clear().where({
      a: { operator: '=', value: {} },
      b: { operator: '>', value: [] },
      c: { operator: '', value: 0 },
    }).toQuery()
    expect(mysql.format(...query)).toBe('')
  })

  des = 'where({ [key: string]: { '
    + 'operator: string, '
    + 'value: (qb) => {sql: string, values: Array}|qb|void'
    + ' } }, tableName: string)'
  it(des, () => {
    query = qb.clear().where({
      a: {
        operator: 'in',
        value: () => {},
      },
    }).toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where({
      a: {
        operator: 'in',
        value: () => ({
          sql: 'select ?? from ?? where ?? = ?',
          values: ['f1', 't', 'f2', 1],
        }),
      },
    }).toQuery()
    sql = ' where `a` in (select `f1` from `t` where `f2` = 1)'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().where({
      a: {
        operator: 'in',
        value: (builder) => {
          builder.select('f1').from('t').where({ f2: 1 })
        },
      },
    }).toQuery()
    sql = ' where `a` in (select `f1` from `t` where `f2` = 1)'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().where({
      a: {
        operator: 'in',
        value() {
          this.select('f1').from('t').where({ f2: 1 })
        },
      },
    }).toQuery()
    sql = ' where `a` in (select `f1` from `t` where `f2` = 1)'
    expect(mysql.format(...query)).toBe(sql)
  })

  it('where({ [key: string]: { [op:string]: string|number|boolean } }, tableName: string)', () => {
    query = qb.clear().where({ a: { in: ['a', 'b'] } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` in ('a', 'b')")

    query = qb.clear().where({ a: { '>': 1, '<': 10 } }).toQuery()
    expect(mysql.format(...query)).toBe(' where `a` > 1 and `a` < 10')

    query = qb.clear().where({ a: { '=': 1 }, b: { like: 'a' } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` = 1 and `b` like '%a%'")

    query = qb.clear().where({ a: { '>=': 1, '<=': 10 } }).toQuery()
    expect(mysql.format(...query)).toBe(' where `a` >= 1 and `a` <= 10')

    query = qb.clear().where({ a: { '<>': 1, '!=': 10 } }).toQuery()
    expect(mysql.format(...query)).toBe(' where `a` <> 1 and `a` != 10')

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

  des = 'where({ [key: string]: { '
    + '[op: string]: (qb) => {sql: string, values: Array}|qb|void'
    + ' } }, tableName: string)'
  it(des, () => {
    query = qb.clear().where({
      a: { in: () => {} },
    }).toQuery()
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().where({
      a: {
        in: () => ({
          sql: 'select ?? from ?? where ?? = ?',
          values: ['f1', 't', 'f2', 1],
        }),
      },
    }).toQuery()
    sql = ' where `a` in (select `f1` from `t` where `f2` = 1)'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().where({
      a: {
        in: (builder) => {
          builder.select('f1').from('t').where({ f2: 1 })
        },
      },
    }).toQuery()
    sql = ' where `a` in (select `f1` from `t` where `f2` = 1)'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().where({
      a: {
        in() {
          this.select('f1').from('t').where({ f2: 1 })
        },
      },
    }).toQuery()
    sql = ' where `a` in (select `f1` from `t` where `f2` = 1)'
    expect(mysql.format(...query)).toBe(sql)
  })

  des = 'where({[anyKey: string]: '
    + '<{[key:string]: string|number|boolean|{[op:string]: string|number|boolean}}>[]'
    + '}, tableName: string)'
  it(des, () => {
    query = qb.clear().where({ or: [{ a: 1 }, { b: 2 }], c: 3 }).toQuery()
    expect(mysql.format(...query)).toBe(' where (`a` = 1 or `b` = 2) and `c` = 3')

    query = qb.clear().where({ a: { is: null }, or: [{ b: 2 }] }).toQuery()
    expect(mysql.format(...query)).toBe(' where `a` is NULL and `b` = 2')

    query = qb.clear().where({
      a: { is: undefined },
      or1: [
        { b: { '<': 2, '>': 0 } },
        { b: [1, 2] },
      ],
      or2: [
        { c: 1 },
        { d: { '<': 10 } },
        { e: '3', f: true, or: [{ g: { is: null } }, { g: { like: 'gg' } }] },
      ],
      h: 'str',
    }, 't').toQuery()
    sql = ' where `t`.`a` is NULL '
      + 'and ((`t`.`b` < 2 and `t`.`b` > 0) or `t`.`b` in (1, 2)) '
      + 'and (`t`.`c` = 1 or `t`.`d` < 10 or ('
      + "`t`.`e` = '3' and `t`.`f` = true and (`t`.`g` is NULL or `t`.`g` like '%gg%')"
      + ')) '
      + "and `t`.`h` = 'str'"
    expect(mysql.format(...query)).toBe(sql)

    // illegal input
    query = qb.clear().where({
      or: [{ b: 2 }, 1, null, false],
      or2: [{ a: 1 }, { c: [] }, { d: {} }, {}, { e: null }],
    }, 't').toQuery()
    sql = ' where `t`.`b` = 2 and (`t`.`a` = 1 or `t`.`e` = NULL)'
    expect(mysql.format(...query)).toBe(sql)
  })

  it('where({ [tableName: string]: Object)', () => {
    query = qb.clear().where({ t: { a: { in: ['a', 'b'] } } }).toQuery()
    expect(mysql.format(...query)).toBe(" where `t`.`a` in ('a', 'b')")

    query = qb.clear().where({ t: { a: { '>': 1, '<': 10 } } }).toQuery()
    expect(mysql.format(...query)).toBe(' where `t`.`a` > 1 and `t`.`a` < 10')

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
        { t2: { b: [1, 2] } },
      ],
      or2: [
        { t3: { c: 1 } },
        { t3: { d: { '<': 10 } } },
        {
          t3: { e: '3' },
          t4: { f: true },
          or: [
            { t4: { g: { is: null } } },
            { t4: { g: { like: 'gg' } } },
          ],
        },
      ],
      t5: { h: 'str' },
    }, 't').toQuery()
    sql = ' where `t1`.`a` is NULL '
      + 'and ((`t1`.`b` < 2 and `t1`.`b` > 0) or `t2`.`b` in (1, 2)) '
      + 'and (`t3`.`c` = 1 or `t3`.`d` < 10 or ('
      + "`t3`.`e` = '3' and `t4`.`f` = true and (`t4`.`g` is NULL or `t4`.`g` like '%gg%')"
      + ')) '
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
          { b: [1, 2] },
        ],
        or2: [
          { d: 20 },
          { d: { '<': 10 } },
          { e: '3', f: true, or: [{ g: { is: null } }, { g: { like: 'gg' } }] },
        ],
        h: 'str',
      },
    ]).toQuery()
    sql = ' where (`a` > 0 and `a` < 10)'
      + ' or `a` = 15'
      + ' or ('
      + '`c` is NULL '
      + 'and ((`b` < 2 and `b` > 0) or `b` in (1, 2)) '
      + 'and (`d` = 20 or `d` < 10 or ('
      + "`e` = '3' and `f` = true and (`g` is NULL or `g` like '%gg%')"
      + ')) '
      + "and `h` = 'str'"
      + ')'
    expect(mysql.format(...query)).toBe(sql)

    query = qb.clear().where([
      { t1: { a: { '>': 0, '<': 10 } } },
      { t1: { a: 15 } },
      {
        t2: { c: { is: undefined } },
        or1: [
          { t3: { b: { '<': 2, '>': 0 } } },
          { t3: { b: [1, 2] } },
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
            ],
          },
        ],
        t9: { h: 'str' },
      },
    ]).toQuery()
    sql = ' where (`t1`.`a` > 0 and `t1`.`a` < 10)'
      + ' or `t1`.`a` = 15'
      + ' or ('
      + '`t2`.`c` is NULL '
      + 'and ((`t3`.`b` < 2 and `t3`.`b` > 0) or `t3`.`b` in (1, 2)) '
      + 'and (`t4`.`d` = 20 or `t5`.`d` < 10 or ('
      + "`t6`.`e` = '3' and `t7`.`f` = true and (`t7`.`g` is NULL or `t8`.`g` like '%gg%')"
      + ')) '
      + "and `t9`.`h` = 'str'"
      + ')'
    expect(mysql.format(...query)).toBe(sql)
  })

  it('andWhere(), orWhere()', () => {
    query = qb.clear().andWhere({ a: 'a' }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` = 'a'")

    query = qb.clear().where({ a: 1 }).andWhere({ b: 2 }).toQuery()
    expect(mysql.format(...query)).toBe(' where `a` = 1 and `b` = 2')

    query = qb.clear().orWhere({ a: 'a' }).toQuery()
    expect(mysql.format(...query)).toBe(" where `a` = 'a'")

    query = qb.clear().where({ a: 1 }).orWhere({ b: 2 }).toQuery()
    expect(mysql.format(...query)).toBe(' where `a` = 1 or `b` = 2')
  })
})
```

### order

```JavaScript
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
```

### limit offset page

```JavaScript
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
```

### group by

```JavaScript
describe('group', () => {
  let qb
  let query

  beforeEach(() => {
    qb = new Builder()
  })

  it('group(fields: string, tableName?: string)', () => {
    query = qb.clear().group('f1').toQuery();
    expect(mysql.format(...query)).toBe(' group by `f1`')

    query = qb.clear().group('f1', 't').toQuery();
    expect(mysql.format(...query)).toBe(' group by `t`.`f1`')

    query = qb.clear().group(' f1 ', ' t ').toQuery();
    expect(mysql.format(...query)).toBe(' group by `t`.`f1`')

    query = qb.clear().group().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().group('').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().group('', 't').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().group('  ').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().group('f1', '').toQuery();
    expect(mysql.format(...query)).toBe(' group by `f1`')
  })

  it('group(fields: <string>[], tableName?: string)', () => {
    query = qb.clear().group(['f1', 'f2']).toQuery();
    expect(mysql.format(...query)).toBe(' group by `f1`, `f2`')

    query = qb.clear().group(['f1', 'f2'], 't').toQuery();
    expect(mysql.format(...query)).toBe(' group by `t`.`f1`, `t`.`f2`')

    query = qb.clear().group([' f1 '], ' t ').toQuery();
    expect(mysql.format(...query)).toBe(' group by `t`.`f1`')

    query = qb.clear().group([1, true, null, undefined]).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().group(['f1'], 1).toQuery();
    expect(mysql.format(...query)).toBe(' group by `f1`')

    query = qb.clear().group(['f1'], true).toQuery();
    expect(mysql.format(...query)).toBe(' group by `f1`')

    query = qb.clear().group([], 't').toQuery();
    expect(mysql.format(...query)).toBe('')
  })

  it('group(fields: { [tableName:string]: string | <string>[])', () => {
    query = qb.clear().group({ t: 'f1' }).toQuery();
    expect(mysql.format(...query)).toBe(' group by `t`.`f1`')

    query = qb.clear().group({ t: ['f1', 'f2'] }).toQuery();
    expect(mysql.format(...query)).toBe(' group by `t`.`f1`, `t`.`f2`')

    query = qb.clear().group({ t1: ['f1', 'f2'], t2: 'f3' }).toQuery();
    expect(mysql.format(...query)).toBe(' group by `t1`.`f1`, `t1`.`f2`, `t2`.`f3`')

    query = qb.clear().group({ t1: {}, t3: null, t4: 1, t5: true }).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().group({ t1: [], t2: '' }).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().group({}).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().group({ t: [1, true, null, undefined] }).toQuery();
    expect(mysql.format(...query)).toBe('')
  })
})
```

### insert

```JavaScript
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
```

### update

```JavaScript
describe('update', () => {
  let qb
  let query
  let sql

  beforeEach(() => {
    qb = new Builder()
  })

  it('update(tableName: string, data: {[key]: string|number|boolean}, where?: Array|Object)', () => {
    query = qb.clear().update().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().update('t').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().update('t', {}).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().update('t', { a: 1 }).toQuery();
    expect(mysql.format(...query)).toBe('update `t` set `a` = 1')

    query = qb.clear().update('t', { a: true, b: 'str', c: null }).toQuery();
    expect(mysql.format(...query)).toBe("update `t` set `a` = true, `b` = 'str', `c` = NULL")

    query = qb.clear().update('t', { a: 1 }, { id: 1 }).toQuery();
    expect(mysql.format(...query)).toBe('update `t` set `a` = 1 where `id` = 1')

    query = qb.clear().update('t', { a: true, b: 'str', c: null }, [{ id: 1 }, { f: 2 }]).toQuery();
    sql = "update `t` set `a` = true, `b` = 'str', `c` = NULL where `id` = 1 or `f` = 2"
    expect(mysql.format(...query)).toBe(sql)

    // illegal input
    query = qb.clear().update('t', []).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().update('t', null).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().update('t', 1).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().update('t', 'string').toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().update('t', undefined).toQuery();
    expect(mysql.format(...query)).toBe('')

    // illegal input
    query = qb.clear().update('t', true).toQuery();
    expect(mysql.format(...query)).toBe('')
  })
})
```

### delete

```JavaScript
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
```

### sub padEnd

```JavaScript
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
```

### count max min avg sum

```JavaScript
describe('aggregate function', () => {
  let qb
  let query

  beforeEach(() => {
    qb = new Builder()
  })

  it('count(as?:string)', () => {
    query = qb.clear().count().toQuery();
    expect(mysql.format(...query)).toBe('count(*)')

    query = qb.clear().count('').toQuery();
    expect(mysql.format(...query)).toBe('count(*)')

    query = qb.clear().count('f1').toQuery();
    expect(mysql.format(...query)).toBe('count(*) as `f1`')

    query = qb.clear().count(true).toQuery();
    expect(mysql.format(...query)).toBe('count(*)')

    query = qb.clear().count(null).toQuery();
    expect(mysql.format(...query)).toBe('count(*)')

    query = qb.clear().count(1).toQuery();
    expect(mysql.format(...query)).toBe('count(*)')

    query = qb.clear().count({}).toQuery();
    expect(mysql.format(...query)).toBe('count(*)')

    query = qb.clear().count([]).toQuery();
    expect(mysql.format(...query)).toBe('count(*)')
  })

  it('max(field: string, as?:string)', () => {
    query = qb.clear().max().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().max('').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().max('f1').toQuery();
    expect(mysql.format(...query)).toBe('max(`f1`)')

    query = qb.clear().max('f1', 'r').toQuery();
    expect(mysql.format(...query)).toBe('max(`f1`) as `r`')

    query = qb.clear().max([]).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().max(['t', 'f1', 'f2']).toQuery();
    expect(mysql.format(...query)).toBe('max(`t`.`f1`)')

    query = qb.clear().max(['t', 'f1'], 'r').toQuery();
    expect(mysql.format(...query)).toBe('max(`t`.`f1`) as `r`')

    query = qb.clear().max(true).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().max(null).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().max(1).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().max({}).toQuery();
    expect(mysql.format(...query)).toBe('')
  })

  it('min(field: string, as?:string)', () => {
    query = qb.clear().min().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().min('').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().min('f1').toQuery();
    expect(mysql.format(...query)).toBe('min(`f1`)')

    query = qb.clear().min('f1', 'r').toQuery();
    expect(mysql.format(...query)).toBe('min(`f1`) as `r`')

    query = qb.clear().min([]).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().min(['t', 'f1', 'f2']).toQuery();
    expect(mysql.format(...query)).toBe('min(`t`.`f1`)')

    query = qb.clear().min(['t', 'f1'], 'r').toQuery();
    expect(mysql.format(...query)).toBe('min(`t`.`f1`) as `r`')

    query = qb.clear().min(true).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().min(null).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().min(1).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().min({}).toQuery();
    expect(mysql.format(...query)).toBe('')
  })

  it('avg(field: string, as?:string)', () => {
    query = qb.clear().avg().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().avg('').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().avg('f1').toQuery();
    expect(mysql.format(...query)).toBe('avg(`f1`)')

    query = qb.clear().avg('f1', 'r').toQuery();
    expect(mysql.format(...query)).toBe('avg(`f1`) as `r`')

    query = qb.clear().avg([]).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().avg(['t', 'f1', 'f2']).toQuery();
    expect(mysql.format(...query)).toBe('avg(`t`.`f1`)')

    query = qb.clear().avg(['t', 'f1'], 'r').toQuery();
    expect(mysql.format(...query)).toBe('avg(`t`.`f1`) as `r`')

    query = qb.clear().avg(true).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().avg(null).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().avg(1).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().avg({}).toQuery();
    expect(mysql.format(...query)).toBe('')
  })

  it('sum(field: string, as?:string)', () => {
    query = qb.clear().sum().toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().sum('').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().sum('f1').toQuery();
    expect(mysql.format(...query)).toBe('sum(`f1`)')

    query = qb.clear().sum('f1', 'r').toQuery();
    expect(mysql.format(...query)).toBe('sum(`f1`) as `r`')

    query = qb.clear().sum([]).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().sum(['t', 'f1', 'f2']).toQuery();
    expect(mysql.format(...query)).toBe('sum(`t`.`f1`)')

    query = qb.clear().sum(['t', 'f1'], 'r').toQuery();
    expect(mysql.format(...query)).toBe('sum(`t`.`f1`) as `r`')

    query = qb.clear().sum(true).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().sum(null).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().sum(1).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().sum({}).toQuery();
    expect(mysql.format(...query)).toBe('')
  })
})
```

