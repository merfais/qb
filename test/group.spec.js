const mysql = require('mysql')
const Builder = require('..')

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

