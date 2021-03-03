const mysql = require('mysql')
const Builder = require('..')

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

