const _ = require('./utils')

module.exports = function sub(fn, ...args) {
  const SqlBuilder = require('./index')  // eslint-disable-line global-require
  const builder = new SqlBuilder()
  let result = fn.call(builder, builder, ...args);
  if (!result) {
    result = builder
  }
  if (_.isString(result.sql) && _.isArray(result.values)) {
    return { sql: result.sql, values: result.values }
  }
  return { sql: '', values: [] }
}

