const mysql = require('mysql')
const Builder = require('..')

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

