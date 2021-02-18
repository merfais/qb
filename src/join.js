module.exports = function join(target, source, mapping, prefix) {
  let sql = '';
  const values = [];
  if (!source || !target || !mapping || _.isEmpty(mapping)) {
    return { sql, values }
  }
  if (prefix) {
    sql += ` ${prefix}`
  }
  sql += ' join ?? on '
  values.push(target)
  sql += _.map(mapping, (sKey, tKey) => {
    values.push(source, sKey, target, tKey)
    return '??.?? = ??.??'
  }).join(' and ')
  return { sql, values }
}
