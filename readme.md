[中文](./readme-ch.md) [English](./readme-en.md)

> `qb-mysql`是一款 服务于mysql的 query builder 工具，其通过链式调用的方式将结构化数据组装成用于mysql的查询对象。`qb-mysql` 不仅体积非常小巧，而且功能十分强大，API丰富多样，可以轻松应对企业级的应用开发

# 背景

日常server开发中，在处理表关系稍微复杂的应用时，或做查询性能优化时，使用ORM工具库处理关联表会稍显捉襟见肘，这些时候会发现裸写sql更舒适，更便捷。但裸写sql一旦犯懒就很可能埋下注入的坑。

虽然 [mysql js](https://www.npmjs.com/package/mysql#install) 提供了 [escaping-query-values](https://www.npmjs.com/package/mysql#escaping-query-values) 和 [escaping-query-identifiers](https://www.npmjs.com/package/mysql#escaping-query-identifiers) 的方式，但你依旧可能会使用这种 `select a.name, a.score, b.name from tableA a inner join TableB b on a.bId = b.id where a.id=${aId} and b.id=${bId}` 懒惰但快捷的方式拼接你的query语句。因为写成防止注入的版本escape版，需要写更多重复的代码，如下
```javascript
const aId = 1
const bId = 1
const sql = 'select ??.??, ??.??, ??.?? from ?? ?? inner join ?? ?? on ??.?? = ??.?? where ??.?? = ? and ??.?? = ?'
const values = ['a', 'name', 'a', 'score', 'b', 'name', 'tableA', 'a', 'tableB', 'b', 'a', 'bId', 'b', 'id', 'a', 'id', aId, 'b', 'id', bId]
```
写起来是不是很崩溃，尤其是复杂些的查询场景，sql语句非常长，escape的字段不仅多，而且重复度很高，看的眼都花了。

这种情况下，使用 `qb-mysql` 就可以轻松搞定了

## 安装与使用
+ 安装
```shell
npm i -S qb-mysql
```
+ 引入
```javascript
const Querybuilder = require('qb-mysql')
```
+ 使用
```javascript
const aId = 1
const bId = 1

const qb = new Querybuild()

qb.select({ tableA: ['name', 'score'], tableB: ['name'] })
    .from('tableA')
    .innerJoin('tableB', { id: bId })
    .where({ tableA: { id: aId }, tableB: { id: bId } })

connection.query(...qb.toQuery())

// 生成的sql语句为
// console.log(mysql.format(...qb.toQuery()))
// select `tableA`.`name`, `tableB`.`score`, `tableB`.`name` from `tableA`
// inner join `tableB` on `tableB`.`id` = `tableA`.`bId` where `tableA`.`id` = 1 and `tableB`.`id` = 1
```

# API

+ [select](#select)
+ [count max min avg sum](#count-max-min-avg-sum)
+ [from](#from)
+ [join](#join)
+ [where](#where)
+ [order](#order-by)
+ [page limit offset](#page-limit-offset)
+ [group by](#group-by)
+ [insert](#insert)
+ [update](#update)
+ [delete](#delete)
+ [sub padEnd](#sub-padEnd)

## select

**参数类型**
+ type field = string | number | boolean
+ type cb = (qb: queryBuilder, tableName?: string) => queryBuilder | { sql: string, values: any[] } | void
+ type renane = string
+ type asArr = [field, rename]
+ type fieldArr = (field | asArr | cb)[]
+ type asObj = { [key: string]: rename }
+ type fieldObj = asObj | { [key: string]: cb }
+ type table = { tableName: valObj | valArr | cb }

**函数**

| 列表                                        | 说明                       |
|---------------------------------------------|---------------------------|
| select(params: field) => qb                 | 单个字段                   |
| select(params: fieldArr \| fieldObj) => qb  | 多个字段                   |
| select(params: table) => qb                 | 字段中带表名，支持多个表    |
| select(params: cb) => qb                    | 使用函数，参数是一个新的queryBuilder对象，返回值可有可无 |

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到
```javascript
// 单个字段，如果是字符串则认为是字段，数字或布尔则认为是值
qb.select('a') // => select `a`
qb.select(1) //  => select 1
qb.select() // => select *  // 空字符串，null，undefined返回 *

// 多个字段, 可以用对象，也可以用数组，嵌套数组使用as，对象也使用as
qb.select(['a', 'b']) // => select `a`, `b`
qb.select([['a', 'r']]) // => select `a` as `r`
qb.select({ a: 'ra', b: 'rb' }) // => select `a` as `ra`, `b` as `rb`
qb.select({}) // => select *  // 空对象，空数组返回 *

// 带表名，使用对象，多个表则使用多组kv，value值类型同多个值的类型
qb.select({ t: ['a'] }) // => select `t`.`a`
qb.select({ t1: { a: 'ra' }, t2: [['a', 'ra'], 'b'] }) // => select `t1`.`a` as `ra`, `t2`.`a` as `ra`, `t2`.`b`
qb.select({ t: [] }) // => select `t`.* // value是空值时返回 *

// 静态类型不够用，也可以使用函数，
// 第一个参数是一个新的queryBuilder对象，非箭头函数也可以使用this，不用参数，在一些场景中有第二参数tableName
// 返回值可以是{ sql: string, values: any[] }类型的对象，也可以没有，如果没有则使用queryBuilder对象
qb.select({ min: qb => qb.min('a') }) // => select min(`a`)
qb.select([() => ({ sql: 'max(??) as ??', values: ['a', 'maxA'] }), 'b']) // => select max(`a`) as `maxA`, `b`
qb.select({ t: { avg(qb, tableName) { this.avg([tableName, 'a'], 'a') }, b: 'b' } }) // => select avg(`t`.`a`) as `a`, `t`.`b` as `b`
```
## count max min avg sum

**参数类型**
+ type name = string
+ type tableName = string

**函数**

`qb-mysql`只内置了`count`, `max`, `min`, `avg`, `sum` 这几个常用的函数，且一般要配合select的子函数使用

| 列表                              | 说明                       |
|-----------------------------------|---------------------------|
| count(as?: name) => qb                  | 无  |
| max(field: name, as?: name) => qb       | 无  |
| min(field: name, as?: name) => qb       | 无  |
| avg(field: name, as?: name) => qb       | 无  |
| sum(field: name, as?: name) => qb       | 无  |
| max([tableName, name], as?: name) => qb | 含表名  |
| min([tableName, name], as?: name) => qb | 含表名  |
| avg([tableName, name], as?: name) => qb | 含表名  |
| sum([tableName, name], as?: name) => qb | 含表名  |

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到

```javascript
// 单个字段，如果是字符串则认为是字段，数字或布尔则认为是值
qb.count('count') // => count(*) as count
qb.avg('a') // => avg(`a`)
qb.max('a', 'maxA') // => max(`a`) as `maxA`
qb.min(['t', 'a'], 'min') // => min(`t`.`a`) as `min`
qb.select((sub) => sub.sum('a', 'sum')) // => select sum(`a`) as `sum`
```

## from

**参数类型**
+ type name = string

**函数**
| 列表                                        | 说明                       |
|---------------------------------------------|---------------------------|
| from(tableName: name, rename?: name) => qb | 无                         |

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到
```javascript
// 单个字段，如果是字符串则认为是字段，数字或布尔则认为是值
qb.from('t') // => from `t`
qb.from('t', 'r') // => from `t` `r`
```

## join

**参数类型**
+ type name = string
+ type targetTableKey = string
+ type sourceTableKey = string
+ type mapping = { [key: targetTableKey]: sourceTableKey }

**函数**

包含`join`, `innerJoin`, `leftJoin`, `rightJoin`, `crossJoin`, `outerJoin`，当使用`join`函数时参数列表多最后一个prefix参数，可以用于添加join前的修饰词，以弥补内置函数不够用的情况

| 列表                                        | 说明                       |
|---------------------------------------------|---------------------------|
| from(sourcetable: name).join(targetTable: name, mapping: mapping) => qb | 配合from一起使用，使用前两个参数即可，如果要指定prefix，则需要补齐4个参数 |
| join(targetTable: name, mapping: mapping, sourceTabel: name, prefix?: string) => qb | 独立使用，需要第三个参数 |
| join(params: { target: name, mapping: mapping, source: name }, prefix?: string) => qb | 独立使用，第一个参数使用object类型 |

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到
```javascript
// 配合from使用
qb.from('t1').join('t2', { t1_id: 'id' }) // => from `t1` join `t2` on `t2`.`t1_id` = `t1`.`id`

// 独立使用，一般是多表联合
qb.from('t1').join('t2', { t1_id: 'id' }).join('t3', { t2_id: id }, 't2')
// => from `t1` join `t2` on `t2`.`t1_id` = `t1`.`id` join `t3` on `t3`.`t2_id` = `t2`.`id`

// 第一个参数可以用object
qb.join({ source: 't1', target: 't2', mapping: { t1_id: id } }) => // join `t2` on `t2`.`t1_id` = `t1`.`id`
```

## where
**参数类型**
+ type name = string
+ type cb = (qb: queryBuilder) => queryBuilder | { sql: string, values: any[] } | void
+ type value = string | number | boolean | cb | null | undefined
+ type valueArr = value[]
+ type ops = 'in' | 'not in' | 'like' | 'not like' | 'is' | 'is not' | '!=' | '>' | '<' | '>=' | '<=' | '=' | '<>' | '<=>'
+ type opVal = { operator: ops, value: value, prefix?: boolean, suffix?: boolean }
+ type opsInObj = 'in' | 'not in' | 'like' | 'not like' | '%like' | 'not %like' | 'like%' | 'not like%' | 'is' | 'is not' | '!=' | '>' | '<' | '>=' | '<=' | '=' | '<>' | '<=>'
+ type opObj = { [key: opsInObj]: val }
+ type conditionObj = { [key: name]: value | valueArr | opVal | opObj }
+ type conditionObjWithOr = { [anyKey: string]: conditionObj[] }
+ type withTable = { [table: name]: conditionObje | conditionObjWithOr }
+ type conditionArr = (conditionObj | conditionObjWithOr | withTable)[]

**函数**
| 列表                                        | 说明                       |
|---------------------------------------------|---------------------------|
| where(condition: conditionObj, tableName?: name) => qb | 最外层使用and连接，且只有and连接 |
| where(condition: conditionObjWithOr, tableName?: name) => qb | 最外层使用and连接，中间含or，and子句 |
| where(condition: withTable) => qb                      | 多个表联合过滤 |
| where(condition: conditionArr, tableName?: name) => qb | 最层使用or连接，中间含and，or子句 |


**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到
```javascript
/** ******************** 只用and连接 *************************************/
// value 是简单类型
qb.where({ a: 1, b: 'b', c: true })
// =>  where `a` = 1 and `b` = 'b' and `c` = true

// value是简单类型的数组，转成使用in函数，使用第二参数，指定table名字
qb.where({ a: [1, 2 ,3], b: 'str' }, 't')
// => where `t`.`a` in (1, 2, 3) and `t`.`b` = `str`

// value使用sub函数
qb.where({ a: sub => sub.select('f1').from('t').where({ f2: 1 }), b: 2 })
// => where `a` = (select `f1` from `t` where `f2` = 1) and b = 2

// value使用 {operator, value}对象
qb.where({ a: { operator: '>', value: 1 }, b: {  operator: 'like', value: 'str', prefix: true } })
// => where `a` > 1 and `b` like '%str'

// value使用 {operator, value}对象，且对象的value是sub函数
qb.where({ a: { operator: 'in', value: sub => sub.select('f1').from('t').where({ f2: 1 }) }, b: 1 })
// => where `a` in (select `f1` from `t` where `f2` = 1) and b = 1

// value使用 限制key是固定operator取值 的对象
qb.where({ a: { in: [1, 2, 3] }, b: { '>': 1, '<': 10 } })
// => where `a` in (1, 2, 3) and `b` > 1 and `b` < 10'

// value使用 限制key是固定operator取值 的对象，且对象value是sub函数
qb.where({ a: { in: sub => sub.select('f1').from('t').where({ f2: 1 }) }, b: 1 })
// => where `a` in (select `f1` from `t` where `f2` = 1) and b = 1

/** ************** 对or条件使用and连接，即通过()提升or的优先级 ************************/
// 当参数对象的value类型时对象数组时，数组内的对象使用or连接，且通过()提升优先级，数组内对象如果含多个key时依旧使用and连接
// 此时参数对象的key无意义，只要不重复即可，因为对象key重复会出现覆盖。
qb.where({
  a: { is: undefined },
  or1: [
    { b: { '<': 2, '>': 0 } },
    { b: [1, 2] },
  ],
  or2: [
    { c: 1 },
    { d: { 'like%': str } },
    { e: '3', f: true, or: [{ g: { is: null } }, { g: { like: 'gg' } }] },
  ],
  h: 'str',
}, 't')
// 为了方便阅读，添加了本不存在的空格和缩进
// => where `t`.`a` is NULL
//     	and ((`t`.`b` < 2 and `t`.`b` > 0) or `t`.`b` in (1, 2))
//      and (`t`.`c` = 1
//        or `t`.`d` like 'str%'
//        or (`t`.`e` = '3' and `t`.`f` = true and (`t`.`g` is NULL or `t`.`g` like '%gg%'))
//      )
//      and `t`.`h` = 'str'

/** **************** 多个表联合查询，对多个表字段同时过滤 *************************/
// 表名作为参数对象的key，对象的value是条件表达式，与前面函数的第一个参数使用相同的schema
// 可以认为是在原来的基础上添加包裹了一级tableName而成，
// 但是tableName的值(也就是参数对象的key)不能是operator，value, 以及operator的取值（比如in，is）
// 因为，一旦key取为这些值会回退为操作符的场景，不再会当做tableName

//  第二个参数不用传，传了也无效果
qb.where({ t1: { a: { '=': 1 } }, t2: { b: { like: 'a' } } }, 't')
// => where `t1`.`a` = 1 and `t2`.`b` like '%a%'

qb.where({
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
})
// 为了方便阅读，添加了本不存在的空格和缩进
// => where `t1`.`a` is NULL
//      and ((`t1`.`b` < 2 and `t1`.`b` > 0) or `t2`.`b` in (1, 2))
//      and (`t3`.`c` = 1
//        or `t3`.`d` < 10
//        or (`t3`.`e` = '3' and `t4`.`f` = true and (`t4`.`g` is NULL or `t4`.`g` like '%gg%'))
//      )
//      and `t5`.`h` = 'str

/** **************** 最外层使用or连接语句 ***********************/
// 但参数不再是对象，而是对象数组时，则各个对象生成的语句使用or连接， 对象内的连接规则同前面的函数
// 不带tableName
qb.where([{ a: { '>': 0, '<': 10 } }, { a: 15 }])
// => where (`a` > 0 and `a` < 10) or `a` = 15'

// 带单个tableName
qb.where([{ a: { '>': 0, '<': 10 } }, { a: 15 }], 't')
// => where (`t`.`a` > 0 and `t`.`a` < 10) or `t`.`a` = 15'

// 多个tableName, 第二个参数不用传，传了也无效
qb.where([
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
])
// 为了方便阅读，添加了本不存在的空格和缩进
// => where (`t1`.`a` > 0 and `t1`.`a` < 10)
//      or `t1`.`a` = 15
//      or (`t2`.`c` is NULL
//        and ((`t3`.`b` < 2 and `t3`.`b` > 0) or `t3`.`b` in (1, 2))
//        and (`t4`.`d` = 20
//          or `t5`.`d` < 10
//          or (`t6`.`e` = '3'
//            and `t7`.`f` = true
//            and (`t7`.`g` is NULL or `t8`.`g` like '%gg%')
//          )
//        )
//        and `t9`.`h` = 'str'
//      )
```

## order by

**参数类型**
+ type field = string
+ type order = 'desc' | 'asc' | 'DESC' | 'ASC'
+ type fieldOrder = string
+ type fieldsOrder = { [key: field]: order }

**函数**
| 列表                             | 说明                       |
|----------------------------------|---------------------------|
| order(param: fieldOrder) => qb   | 对一个字段排序，排序方式与字段间使用空格连接，可以没有排序方式  |
| order(param: fieldsOrder) => qb  | 对多个字段排序，key是字段，value是排序方式，value是空值表示不填排序方式 |

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到
```javascript
// 对一个字段排序
qb.order('a') // => order by `a`
qb.order('a desc') // => order by `a` desc

// 对多个字段排序
qb.order({ a: '', b: 'desc' }) // => order by `a`, `b` desc
qb.order({ a: 'DESC', b: 'ASC' }) // => order by `a` DESC, `b` ASC
```

## page limit offset
**参数类型**
+ type val = number

**函数**
| 列表                                        | 说明                       |
|--------------------------------------------|---------------------------|
| limit(size: val) => qb                     | size需大于0  |
| offset(size: val) => qb                    | size需大于0 |
| page(size: val, page?: val) => qb          | page是对limit和offse的组合  |

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到

```javascript
qb.limit(1) // => limit 1
qb.offset(1) // => offset 1
qb.page(10) // => limit 10
qb.page(10, 1) // => limit 10
qb.page(10, 2) // => limit 10 offset 10
```

## group by

**参数类型**

+ type name = string
+ type table = { [key: name]: name | name[] }

**函数**

| 列表                                            | 说明                       |
|-------------------------------------------------|---------------------------|
| group(field: name, tableName?: name) => qb      | 对单个字段聚合              |
| group(fields: name[], tableName?: string) => qb | 对多个字段聚合              |
| group(fields: table) => qb                      | 对多个表的字段聚合          |

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到
```javascript
// 单个字段聚合
qb.group('a') // => group by `a`
qb.group('a', 't') // => group by `t`.`a`

// 多个字段聚合
qb.group(['a', 'b']) // => group by `a` `b`
qb.group(['a', 'b'], 't') // => group by `t`.`a` `t`.`b`

// 多个表的字段聚合
qb.group({ t: 'a' }) // => group by `t`.`a`
qb.group({ t1: ['a', 'b'], t2: 'c' }) // => group by `t1`.`a` `t1`.`b` `t2`.`c`
```

## insert

**参数类型**
+ type name = string
+ type data = { [key: string]: string | number | boolean | null | undefined }

**函数**
| 列表                                          | 说明                       |
|-----------------------------------------------|---------------------------|
| insert(tableName: name, data: data) => qb     | 插入单行数据      |
| insert(tableName: name, data: data[]) => qb   | 插入多行数据      |

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到

```javascript
// 插入单行数据，使用set语句
qb.insert('t', { a: 1, b: '2', c: true }) // => insert into `t` set `a` = 1, `b` = '2', `c` = true

// 插入多行数据，使用values语句
qb.insert('t', [{ a: 1, b: 'b' }, { a: 2, b: 'b' }]) // => insert into `t` (`a`, `b`) values (1, 'b'), (2, 'b')

```

## update

**参数类型**
+ type name = string
+ type data = { [key: string]: string | number | boolean | null | undefined }
+ type where = Array | Object // 参考where部分

**函数**
| 列表                                          | 说明                       |
|-----------------------------------------------|---------------------------|
| update(tableName: name, data: data, where?: where) => qb | 第三个where参数选填，与where函数参数类型相同  |

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到
```javascript
qb.update('t', { a: true, b: 'str', c: null， d: 1 })
// => update `t` set `a` = true, `b` = 'str', `c` = NULL, `d` = 1
qb.update('t', { a: true, b: 'str', c: null }, [{ id: 1 }, { f: 2 }])
// => update `t` set `a` = true, `b` = 'str', `c` = NULL where `id` = 1 or `f` = 2
```

## delete

**参数类型**
+ type name = string
+ type where = Array | Object  // 参考where部分

**函数**
| 列表                                        | 说明                       |
|---------------------------------------------|---------------------------|
| delete(tableName: name, where?: where) => qb | 第二个where参数选填，与where函数参数类型相同 |

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到
```javascript
// 单个字段，如果是字符串则认为是字段，数字或布尔则认为是值
qb.delete('t') // => delete from `t`
qb.delete('t', { id: 1 }) // => delete from `t` where `id` = 1'
```

## sub padEnd

当内置函数不能满足需求时，可通过`sub`高阶函数自定义sql，`sub`只接受一个回调函数类型的参数, 该回调函数有一个参数`qb`。

`qb`是一个全新的`queryBuilder`对象，当回调函数使用非箭头函数时，`this`指向这个`queryBuilder`对象，因此使用`this`与使用`qb`是等效的

回调函数的返回值可有可无，如果有返回值，返回值必须是包含 `{ sql: string, values: [] }` 的对象，`qb-mysql` 内部会使用`sql`和`values`的值用于生成query对象，如果没有返回值，则会直接使用回调函数参数`queryBuilder`对象中的值。

`padEnd`是辅助型函数，用于向`queryBuilder.sql`和`queryBuilder.value`上追加内容，一般会配合`sub`函数一起使用。


**参数类型**
+ type cb = (qb: queryBuilder) => queryBuilder | { sql: string, values: any[] } | void
+ type values = any[]
+ type val = string | values

**函数**
| 列表                                    | 说明                       |
|-----------------------------------------|---------------------------|
| sub(callback: cb) => qb                 | cb函数参数是一个新的queryBuilder对象，返回值可有可无 |
| padEnd(str: val, values?: values) => qb | 向queryBuilder.sql追加string，第2个参数向queryBuilder.values追加值|

**例子**

以下的结果均通过调用 `console.log(mysql.format(...qb.toQuery()))` 得到
```javascript
// 使用子查询
qb.select('f1')
  .from('t1')
  .padEnd(' where ?? in (', ['f2'])
  .sub((builder) => builder.select('f3').from('t2')
  .padEnd(')')
// => 'select `f1` from `t1` where `f2` in (select `f3` from `t2`)
```

## clear

`qb-mysql` 支持了多query查询，当使用多个语句（即多次调用select, insert, update, delete）时，会自动在各条语句间插入分号（;）

`clear`用于清空queryBuilder中已经构建的query语句，当需要新建一条query时，可以使用 `const queryBuilder = new QueryBuilder()`的方式，也可以在已经实例化的`queryBuilder`对象上调用`queryBuilder.clear()`

**参数类型**
+ 无

**函数**
| 列表                    | 说明                       |
|-------------------------|---------------------------|
| clear() => qb           | 一般用于同一作用域中多次调用函数生成query时，清除前面生成的内容 |


**例子**
 ```javascript
 // 1. 创建实例
  const qb = new QueryBuilder()
  qb.select('a').from('t').select(qb => qb.count()).form('t')
  // => select `a` from `t`;select count(*) from `t`

  // 2. 如果调用clear， 在同一个作用域中继续执行以下语句
  qb.clear().select(qb => qb.count()).form('t')
  // => select count(*) from `t`

  // 2. 如果不调用clear，在同一个作用域中继续执行以下语句
  qb.select(qb => qb.count()).form('t')
  // => select `a` from `t`;select count(*) from `t`;select count(*) from `t`
  ```


# 注意事项

+ 调用各个子函数时，调用顺序要严格按照 sql 语句的语法，为了最小化代码体积，`qb-mysql`并未做语法分析和检测，因此及时语句有错误也会生成query对象。

  + 比如 qb.from('t').select('a') 会生成 <code>from \`t\`select \`a`</code>
  + 尤其要特别注意 `order`, `limit`, `offset` 的顺序，写反了会导致sql查询异常

+ `qb-mysql`支持了多query查询，当使用多个语句时，会自动在各个语句间插入分号（`;`），但要注意这不是事务安全的，例如

  ```javascript
  // 同时查询表长度
  qb.select('a').from('t').select(qb => qb.count()).form('t')
  // => select `a` from `t`;select count(*) from `t`

  // 更新数据的同时查询数据，注意这并不是事务安全的，因引擎不同，可能会查到更新前的数据
  qb.update('t', { a: 'a' }, { id: 1 } ).select().form('t').where({ id: 1 })
  // => update `t` set `a` = 'a' where `id` = 1;select * from `t` where `id` = 1
  ```

