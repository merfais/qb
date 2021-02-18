const mysql = require('mysql')
const Builder = require('..')

describe('select', () => {
  let qb
  let query

  beforeEach(() => {
    qb = new Builder()
  })

  it('select *', () => {
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
    query = qb.clear().select('').toQuery();
    expect(mysql.format(...query)).toBe('select *')

    query = qb.clear().select('    ').toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().select('a').toQuery();
    expect(mysql.format(...query)).toBe('select `a`')

    query = qb.clear().select(' a ').toQuery();
    expect(mysql.format(...query)).toBe('select ` a `')

    query = qb.clear().select(1).toQuery();
    expect(mysql.format(...query)).toBe('select 1')

    query = qb.clear().select(true).toQuery();
    expect(mysql.format(...query)).toBe('select true')
  })

  it('select(fields: <string|boolean|number|<string|boolean|number>[]>[])', () => {
    query = qb.clear().select(['a', 'b']).toQuery();
    expect(mysql.format(...query)).toBe('select `a`, `b`')

    query = qb.clear().select([1, true]).toQuery();
    expect(mysql.format(...query)).toBe('select 1, true')

    query = qb.clear().select(['a', '']).toQuery();
    expect(mysql.format(...query)).toBe('select `a`')

    query = qb.clear().select([1, '  ']).toQuery();
    expect(mysql.format(...query)).toBe('select 1')

    query = qb.clear().select([' a ', true]).toQuery();
    expect(mysql.format(...query)).toBe('select ` a `, true')

    query = qb.clear().select([['a', 'b'], 'c']).toQuery();
    expect(mysql.format(...query)).toBe('select `a` as `b`, `c`')

    query = qb.clear().select([[1, 'true'], [true, '1']]).toQuery();
    expect(mysql.format(...query)).toBe('select 1 as `true`, true as `1`')

    query = qb.clear().select([[1, true], [true, 1]]).toQuery();
    expect(mysql.format(...query)).toBe('')

    query = qb.clear().select([['a'], ['a', ''], [' ', 'a'], []]).toQuery();
    expect(mysql.format(...query)).toBe('')
  })

  // it('select(fields: {})')
})
