
## Examples

+ **select**

  Creates a select query, taking an optional array of columns for the query,
  eventually defaulting to * if none are specified when the query is built.
  The response of a select call will resolve with an array of objects selected from the database.

  + .select(column: string[, column]) | .select(columns: array) | .select()
  + .column(column: string[, column]) | .column(columns: array) | .column()
  + .distinct(column: string[, column]) | .distinct(columns: array))


  ```JavaScript
    qb.select('title', 'author', 'year').from('books').toQuery()
    // Outputs:
    select `title`, `author`, `year` from `books`

    qb.select(['title', 'author', 'year']).from('books').toQuery()
    // Outputs:
    select `title`, `author`, `year` from `books`

    qb.select('title').select('author').select('year').from('books').toQuery()
    // Outputs:
    select `title`, `author`, `year` from `books`

    qb.select('title').select(['author', 'year']).from('books').toQuery()
    // Outputs:
    select `title`, `author`, `year` from `books`

    qb.select().table('books').toQuery()
    // Outputs:
    select * from `books`

    // select distinct 'first_name' from customers
    qb.distinct('first_name', 'last_name').from('customers')
    // Outputs:
    select distinct `first_name`, `last_name` from `customers`


    ```
+ **as**

  Allows for aliasing a subquery, taking the string you wish to name the current query.
  If the query is not a sub-query, it will be ignored.

  + .as(name)

  ```JavaScript
    qb.avg('sum_column1').from(qb => {
      qb.sum('column1 as sum_column1').from('t1').groupBy('column1').as('t1')
    }).toQuery()
    // Outputs:
    select avg(`sum_column1`) from (select sum(`column1`) as `sum_column1` from `t1` group by `column1`) as `t1`
  ```

+ **from**

  Specifies the table used in the current query,
  replacing the current table name if one has already been specified.
  This is typically used in the sub-queries performed in the advanced where or union methods.

  + .table(tableName: string)
  + .from(tableName: string) | .from(cb: function(qb)) | .from(raw: qb.raw)

  ```JavaScript
    qb.table('users').select().toQuery()
    // Outputs
    select * from `users`

    qb.select('*').from('users').toQuery()
    // Outputs:
    select * from `users`

    qb.avg('sum').from(qb => {
      qb.sum('column1 as sum').from('users').groupBy('age').as('users')
    }).toQuery()
    // Outputs
    select avg(`sum`) from (select sum(`column1`) as `sum` from `users` group by `age`) as `users`

    qb.avg('sum').from(qb.raw(
      '(select sum(??) as ?? from ?? group by ??) as ??',
      ['column1', 'sum', 'users', 'age', 'users']
    )).toQuery()
    // Outputs
    select avg(`sum`) from (select sum(`column1`) as `sum` from `users` group by `age`) as `users`
  ```
+ **with**

  Add a "with" clause to the query. "With" clauses are supported by PostgreSQL, Oracle, SQLite3 and MSSQL.

  + .with(alias: string, cb: function) | .with(alias: string, raw: qb.raw)

  ```JavaScript
    qb.with('with_alias', qb.raw('select * from `books` where `author` = ?', 'Test'))
      .select('*').from('with_alias').toQuery()
    // Outputs:
    with `with_alias` as (select * from `books` where `author` = 'Test') select * from `with_alias`

    qb.with('with_alias', qb => {
      qb.select('*').from('books').where('author', 'Test')
    }).select('*').from('with_alias').toQuery()
    // Outputs:
    with `with_alias` as (select * from `books` where `author` = 'Test') select * from `with_alias`
  ```

+ **withSchema**

  Specifies the schema to be used as prefix of table name.

  + .withSchema(schemaName: string)

  ```JavaScript
    qb.withSchema('public').select('*').from('users').toQuery()
    // Outputs:
    select * from `public`.`users`
  ```
+ **Where Clauses**

  Several methods exist to assist in dynamic where clauses.
  In many places functions may be used in place of values, constructing subqueries.
  In most places existing queries may be used to compose sub-queries, etc.
  Take a look at a few of the examples for each method for instruction on use:

  Important: Supplying an undefined value to any of the where functions
  will cause an error during sql compilation.
  It cannot know what to do with undefined values in a where clause,
  and generally it would be a programmatic error to supply one to begin with.
  The error will throw a message containing the type of query and the compiled query-string.

  Example:

  ```JavaScript
    qb('accounts').where('login', undefined).select().toQuery()
    // Error:
    // Undefined binding(s) detected when compiling SELECT query: select * from `accounts` where `login` = ?
  ```
  + .where(left: string, operator = '=': string, right: string| number)
  + .where(querys: object)
  + .where(qb: function(qb))
  + .where(raw: qb.raw)
  + .orWhere(~mixed~)
  + .andWhere(~mixed~)

  `where` is not suitable for "in"、"between"、"exists" operator.
  You should use `whereIn`、`whereBetween`、`whereExists` instead.

  ```JavaScript
    // two or three parameter
    qb.table('users').where('id', 1)
    // Outputs:
    select * from `users` where `id` = 1

    qb.table('users').where('id', '<>' 1)
    // Outputs:
    select * from `users` where `id` <> 1

    qb.table('users').where('columnName', 'like', '%rowlikeme%')
    // Outputs:
    select * from `users` where `columnName` like '%rowlikeme%'

    // one parameter use Object Syntax
    qb.table('users').where({
      first_name: 'Test',
      last_name:  'User'
    }).select('id')
    // Outputs:
    select `id` from `users` where `first_name` = 'Test' and `last_name` = 'User'

    // one parameter use callback function
    qb.select().from('users').where(qb => {
      qb.where('id', 1).orWhere('id', '>', 10)
    })
    // Outputs
    select * from `users` where (`id` = 1 or `id` > 10)

    // one parameter use qb.raw
    qb.select().from('users').where(qb.raw(
      'where ?? = ? and ?? <> ?',
      ['id', 1, 'name', 'A']
    ))
    // Outputs
    select * from `users` where `id` = 1 or `name` > 'A'

    // Grouped Chain:
    qb.table('users').where(qb => {
      qb.where('id', 1).orWhere('id', '>', 10)
    }).orWhere('name', 'Tester')
    // Outputs:
    select * from `users` where (`id` = 1 or `id` > 10) or `name` = 'Tester'

    // .orWhere with an object automatically wraps the statement and creates an or (and - and - and) clause
    qb.from('users').where('id', 1).orWhere({votes: 100, user: 'foo'})
    // Outputs:
    select * from `users` where `id` = 1 or (`votes` = 100 and `user` = 'foo')
  ```

  + .whereNot(left: string, operator = '=': string, right: string| number | function(qb))
  + .whereNot(querys: object)
  + .whereNot(qb: function(qb))
  + .whereNot(raw: qb.raw)
  + .orWhereNot(~mixed~)
  + .andWhereNot(~mixed~)

  `whereNot` is not suitable for "in"、"between"、"exists" operator.
  You should use `whereNotIn`、`whereNotBetween`、`whereNotExists` instead.

  ```JavaScript
    qb.whereNot({
      first_name: 'Test',
      last_name:  'User'
    }).select('id').from('users')
    // Outputs:
    select `id` from `users` where not `first_name` = 'Test' and not `last_name` = 'User'

    qb.from('users').whereNot('id', 1)
    // Outputs:
    select * from `users` where not `id` = 1

    qb.from('users').whereNot(qb => {
      qb.where('id', 1).orWhereNot('id', '>', 10)
    }).orWhereNot({name: 'Tester'})
    // Outputs:
    select * from `users` where not (`id` = 1 or not `id` > 10) or not (`name` = 'Tester')

    qb.from('users').whereNot('votes', '>', 100)
    // Outputs:
    select * from `users` where not `votes` > 100
  ```
  + .whereNull(column: string)
  + .orWhereNull
  + .andWhereNull
  + .whereNotNull
  + .orWhereNotNull
  + .andWhereNotNull

  ```JavaScript
    qb.from('users').whereNull('updated_at')
    // Outputs:
    select * from `users` where `updated_at` is null

    qb.from('users').whereNot('name', 'like', 's%').orWhereNotNull('created_at')
    // Outputs:
    select * from `users` where `name` like 's%' or `created_at` is not null
  ```
  + .whereIn(column, values: array | function(qb) | qb.raw)
  + .andWhereIn(~mixed~)
  + .orWhereIn(~mixed~)
  + .whereNotIn(~mixed~)
  + .andWhereNotIn(~mixed~)
  + .orWhereNotIn(~mixed~)

  ```JavaScript
    qb.select('name').from('users')
      .whereIn('id', [1, 2, 3])
      .orWhereIn('id', [4, 5, 6])
    // Outputs:
    select `name` from `users` where `id` in (1, 2, 3) or `id` in (4, 5, 6)

    qb.select('name').from('users')
      .whereIn('account_id', qb => {
        qb.select('id').from('accounts');
      })
    // Outputs:
    select `name` from `users` where `account_id` in (select `id` from `accounts`)

    qb.select().from('users').whereNotIn('account_id', qb.raw(
      'select ?? from ?? where not ?? > ?',
      ['id', 'accounts', 'id', 20]
    ))
    // Outputs
    select * from `users` where `account_id` in (select `id` from `accounts` where `id` > 20)

    qb.from('users').where('name', 'like', '%Test%').orWhereNotIn('id', [1, 2, 3])
    // Outputs:
    select * from `users` where `name` like '%Test%' or `id` not in (1, 2, 3)
  ```
  + .whereExists(cb: function(qb) | qb.raw)
  + .orWhereExists(~mixed~)
  + .andWhereExists(~mixed~)
  + .whereNotExists(~mixed~)
  + .orWhereNotExists(~mixed~)
  + .andWhereNotExists(~mixed~)

  ```JavaScript
    qb.from('users').whereExists(qb => {
      qb.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
    })
    // Outputs:
    select * from `users` where exists (select * from `accounts` where users.account_id = accounts.id)

    qb.from('users').whereExists(qb.raw(
      'select * from ?? where ?? = ??',
      ['accounts', 'users.account_id', 'accounts.id']
    ))
    // Outputs:
    select * from `users` where exists (select * from `accounts` where `users`.`account_id` = `accounts`.`id`)

    qb.from('users').where(id, 2).andWhereNotExists(qb => {
      qb.select('*').from('accounts').whereRaw(
        '?? = ??',
        ['users.account_id', 'accounts.id']
      )
    })
    // Outputs:
    select * from `users` where `id` = 2 and where not exists (select * from `accounts` where `users`.`account_id` = `accounts`.`id`)
  ```
  + .whereBetween(column: string, range: array)
  + .orWhereBetween(~mixed~)
  + .andWhereBetween(~mixed~)
  + .whereNotBetween(~mixed~)
  + .orWhereNotBetween(~mixed~)
  + .andWhereNotBetween(~mixed~)

  ```JavaScript
    qb.from('users').whereBetween('votes', [1, 100])
    // Outputs:
    select * from `users` where `votes` between 1 and 100

    qb.from('users').whereNotBetween('votes', [1, 100])
    // Outputs:
    select * from `users` where `votes` not between 1 and 100
  ```

  + .whereRaw(query, [bindings])

  Convenience helper for .where(qb.raw(query, bindings)).

  ```JavaScript
    qb.from('users').whereRaw('id = ?', [1])
    // Outputs:
    select * from `users` where id = 1

    // arrays must be passed as arguments within a containing array.
    qb.from('users').whereRaw('id in (?)', [[1, 2, 3]])
    // Outputs:
    select * from `users` where id in (1, 2, 3)
  ```
+ **Join Methods**

  Several methods are provided which assist in building joins.

  + .join(table: string, left: string, operator = '=': string, right: string | number)
  + .innerJoin(~mixed~)
  + .leftJoin(~mixed~)
  + .leftOuterJoin(~mixed~)
  + .rightJoin(~mixed~)
  + .rightOuterJoin(~mixed~)
  + .outerJoin(~mixed~)
  + .fullOuterJoin(~mixed~)
  + .crossJoin(~mixed~)

  The join builder can be used to specify joins between tables,
  with the first argument being the joining table,
  the next three arguments being the first join column,
  the join operator and the second join column, respectively.

  ```JavaScript
    qb.select('users.id as id', 'contacts.phone as phone')
      .from('users')
      .join('contacts', 'users.id', '=', 'contacts.user_id')
    // Outputs:
    select `users`.`id` as `id`, `contacts`.`phone` as `phone` from `users` inner join `contacts` on `users`.`id` = `contacts`.`user_id`

    qb.select('users.id', 'contacts.phone').from('users')
      .join('contacts', 'users.id', 'contacts.user_id')
    // Outputs:
    select `users`.`id`, `contacts`.`phone` from `users` inner join `contacts` on `users`.`id` = `contacts`.`user_id`
    ```
    For grouped joins, specify a function as the second argument for the join query,
    and use on with orOn or andOn to create joins that are grouped with parentheses.

    ```JavaScript
    qb.select('*').from('users').join('accounts', join => {
      join.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', 'users.id')
    })
    // Outputs:
    select * from `users` inner join `accounts` on `accounts`.`id` = `users`.`account_id` or `accounts`.`owner_id` = `users`.`id`

    qb.select().from('users').innerJoin('accounts', join => {
      join.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
    })
    // Outputs:
    select * from `users` inner join `accounts` on `accounts`.`id` = `users`.`account_id` or `accounts`.`owner_id` = `users`.`id`

    qb.select().from('users').leftJoin('accounts', join => {
      join.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
    })
    // Outputs:
    select * from `users` left join `accounts` on `accounts`.`id` = `users`.`account_id` or `accounts`.`owner_id` = `users`.`id`
    ```

  + .join(table: string, cb: function(join))

  For nested join statements, specify a function as first argument of on, orOn or andOn

    On Clauses

    + join.on(left: string, operator = '=': string, right: string | number)
    + join.orOn(~mixed~)
    + join.andOn(~mixed~)

    ```JavaScript
      // on | oron
      qb.select('*').from('users').join('accounts', join => {
        join.on(join => {
          join.on('accounts.id', '=', 'users.account_id')
            .orOn('accounts.owner_id', '=', 'users.id')
        })
      })
      // Outputs:
      select * from `users` inner join `accounts` on (`accounts`.`id` = `users`.`account_id` or `accounts`.`owner_id` = `users`.`id`)
    ```

    `on`、`orOn`、`andOn` is not suitable for "in"、"between"、"exists" operator.
    You should use `onIn`、`onBetween`、`onExists`、`onNotIn`、`onNotBetween`、`onNotExists` instead.

    + join.onIn(column: string, values: array | function(qb) | qb.raw)
    + join.orOnIn()
    + join.andOnIn()
    + join.onNotIn()
    + join.orOnNotIn()
    + join.andOnNotIn()

    ```JavaScript
      // on in
      qb.select('*').from('users').join('contacts', join => {
        join.on('users.id', '=', 'contacts.id').onIn('contacts.id', [7, 15, 23, 41])
      })
      //Outputs:
      select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` in (7, 15, 23, 41)

      // on not in
      qb.select('*').from('users').join('contacts', join => {
        join.on('users.id', '=', 'contacts.id').onNotIn('contacts.id', [7, 15, 23, 41])
      })
      // Outputs:
      select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` not in (7, 15, 23, 41)
    ```

    + join.onExists(qb: function(qb) | qb.raw)
    + join.orOnExists()
    + join.andOnExists()
    + join.onNotExists()
    + join.orOnNotExists()
    + join.andOnNotExists()

    ```JavaScript
      // on exists
      qb.select('*').from('users').join('contacts', join => {
        join.on('users.id', '=', 'contacts.id').onExists(qb => {
          qb.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
        })
      })
      // Outputs:
      select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and exists (select * from `accounts` where users.account_id = accounts.id)

      // on not exists
      qb.select('*').from('users').join('contacts', join => {
        join.on('users.id', '=', 'contacts.id').onNotExists(qb => {
          qb.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
        })
      })
      // Outputs:
      select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and not exists (select * from `accounts` where users.account_id = accounts.id)
    ```

    + join.onNull(column: string)
    + join.orOnNull()
    + join.andOnNull()
    + join.onNotNull()
    + join.orOnNotNull()
    + join.andOnNotNull()

    ```JavaScript
      // on null
      qb.select('*').from('users').join('contacts', join => {
        join.on('users.id', '=', 'contacts.id').onNull('contacts.email')
      })
      // Outputs:
      select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`email` is null

      // on not null
      qb.select('*').from('users').join('contacts', join => {
        join.on('users.id', '=', 'contacts.id').onNotNull('contacts.email')
      })
      // Outputs:
      select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`email` is not null
      Adds a onExists clause to the query.
    ```

    + join.onBetween(column: string, range: array)
    + join.orOnBetween()
    + join.andOnBetween()
    + join.onNotBetween()
    + join.orOnNotBetween()
    + join.andOnNotBetween()

    ```JavaScript
      // on between
      qb.select('*').from('users').join('contacts', join => {
        join.on('users.id', '=', 'contacts.id').onBetween('contacts.id', [5, 30])
      })
      // Outputs:
      select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` between 5 and 30

      // on nout between
      qb.select('*').from('users').join('contacts', join => {
        join.on('users.id', '=', 'contacts.id').onNotBetween('contacts.id', [5, 30])
      })
      // Outputs:
      select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` not between 5 and 30
      ```
  + .joinRaw(sql: string, bindings: string | array)

  ```JavaScript
    qb.select('*').from('accounts').joinRaw('natural full join table1').where('id', 1)
    // Outputs:
    select * from `accounts` natural full join table1 where `id` = 1

    qb.select('*').from('accounts').join(qb.raw('natural full join table1')).where('id', 1)
    // Outputs:
    select * from `accounts` inner join natural full join table1 where `id` = 1
  ```
+ **groupBy**

  + .groupBy(name: string)
  + .groupByRaw(sql: string[, bindings: array | string])

  ```JavaScript
    qb.from('users').groupBy('count')
    // Outputs:
    select * from `users` group by `count`

    qb.select('year').sun(profit).from('sales').groupByRaw('year WITH ROLLUP')
    // Outputs:
    select `year`, SUM(`profit`) from `sales` group by year WITH ROLLUP
  ```

+ **orderBy**

  + .orderBy(column: string[, direction: string])
  + .orderByRaw(sql: string[, bindings: array | string])

  ```JavaScript
    qb.from('users').orderBy('name', 'desc')
    // Outputs:
    select * from `users` order by `name` desc
    Adds an order by raw clause to the query.

    qb.select('*').from('table').orderByRaw('col DESC NULLS LAST')
    // Outputs:
    select * from `table` order by col DESC NULLS LAST
  ```

+ **Having Clauses**

  having — .having(column, operator, value)
  Adds a having clause to the query.

  + .having(left: string, operator = '=': string, right: string| number)
  + .having(querys: object)
  + .having(qb: function(qb))
  + .having(raw: qb.raw)
  + .orHaving(~mixed~)
  + .andHaving(~mixed~)

  `having` is not suitable for "in"、"between"、"exists" operator.
  You should use `havingIn`、`havingBetween`、`havingExists` instead.

  ```JavaScript
    // two or three parameter
    qb.table('users').having('id', 1)
    // Outputs:
    select * from `users` having `id` = 1

    qb.table('users').having('id', '<>' 1)
    // Outputs:
    select * from `users` having `id` <> 1

    qb.table('users').having('columnName', 'like', '%rowlikeme%')
    // Outputs:
    select * from `users` having `columnName` like '%rowlikeme%'

    // one parameter use Object Syntax
    qb.table('users').having({
      first_name: 'Test',
      last_name:  'User'
    }).select('id')
    // Outputs:
    select `id` from `users` having `first_name` = 'Test' and `last_name` = 'User'

    // one parameter use callback function
    qb.select().from('users').having(qb => {
      qb.having('id', 1).orHaving('id', '>', 10)
    })
    // Outputs
    select * from `users` having (`id` = 1 or `id` > 10)

    // one parameter use qb.raw
    qb.select().from('users').having(qb.raw(
      'having ?? = ? and ?? <> ?',
      ['id', 1, 'name', 'A']
    ))
    // Outputs
    select * from `users` having `id` = 1 or `name` > 'A'

    // Grouped Chain:
    qb.table('users').having(qb => {
      qb.having('id', 1).orHaving('id', '>', 10)
    }).orHaving('name', 'Tester')
    // Outputs:
    select * from `users` having (`id` = 1 or `id` > 10) or `name` = 'Tester'

    // .orHaving with an object automatically wraps the statement and creates an or (and - and - and) clause
    qb.from('users').having('id', 1).orHaving({votes: 100, user: 'foo'})
    // Outputs:
    select * from `users` having `id` = 1 or (`votes` = 100 and `user` = 'foo')
  ```

  + .havingNot(left: string, operator = '=': string, right: string| number | function(qb))
  + .havingNot(querys: object)
  + .havingNot(qb: function(qb))
  + .havingNot(raw: qb.raw)
  + .orHavingNot(~mixed~)
  + .andHavingNot(~mixed~)

  `havingNot` is not suitable for "in"、"between"、"exists" operator.
  You should use `havingNotIn`、`havingNotBetween`、`havingNotExists` instead.

  ```JavaScript
    qb.havingNot({
      first_name: 'Test',
      last_name:  'User'
    }).select('id').from('users')
    // Outputs:
    select `id` from `users` having not `first_name` = 'Test' and not `last_name` = 'User'

    qb.from('users').havingNot('id', 1)
    // Outputs:
    select * from `users` having not `id` = 1

    qb.from('users').havingNot(qb => {
      qb.having('id', 1).orHavingNot('id', '>', 10)
    }).orHavingNot({name: 'Tester'})
    // Outputs:
    select * from `users` having not (`id` = 1 or not `id` > 10) or not (`name` = 'Tester')

    qb.from('users').havingNot('votes', '>', 100)
    // Outputs:
    select * from `users` having not `votes` > 100
  ```
  + .havingNull(column: string)
  + .orHavingNull
  + .andHavingNull
  + .havingNotNull
  + .orHavingNotNull
  + .andHavingNotNull

  ```JavaScript
    qb.from('users').havingNull('updated_at')
    // Outputs:
    select * from `users` having `updated_at` is null

    qb.from('users').havingNot('name', 'like', 's%').orHavingNotNull('created_at')
    // Outputs:
    select * from `users` having `name` like 's%' or `created_at` is not null
  ```
  + .havingIn(column, values: array | function(qb) | qb.raw)
  + .andHavingIn(~mixed~)
  + .orHavingIn(~mixed~)
  + .havingNotIn(~mixed~)
  + .andHavingNotIn(~mixed~)
  + .orHavingNotIn(~mixed~)

  ```JavaScript
    qb.select('name').from('users')
      .havingIn('id', [1, 2, 3])
      .orHavingIn('id', [4, 5, 6])
    // Outputs:
    select `name` from `users` having `id` in (1, 2, 3) or `id` in (4, 5, 6)

    qb.select('name').from('users')
      .havingIn('account_id', qb => {
        qb.select('id').from('accounts');
      })
    // Outputs:
    select `name` from `users` having `account_id` in (select `id` from `accounts`)

    qb.select().from('users').havingNotIn('account_id', qb.raw(
      'select ?? from ?? where not ?? > ?',
      ['id', 'accounts', 'id', 20]
    ))
    // Outputs
    select * from `users` having `account_id` in (select `id` from `accounts` where `id` > 20)

    qb.from('users').having('name', 'like', '%Test%').orHavingNotIn('id', [1, 2, 3])
    // Outputs:
    select * from `users` having `name` like '%Test%' or `id` not in (1, 2, 3)
  ```
  + .havingExists(cb: function(qb) | qb.raw)
  + .orHavingExists(~mixed~)
  + .andHavingExists(~mixed~)
  + .havingNotExists(~mixed~)
  + .orHavingNotExists(~mixed~)
  + .andHavingNotExists(~mixed~)

  ```JavaScript
    qb.from('users').havingExists(qb => {
      qb.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
    })
    // Outputs:
    select * from `users` having exists (select * from `accounts` where users.account_id = accounts.id)

    qb.from('users').havingExists(qb.raw(
      'select * from ?? where ?? = ??',
      ['accounts', 'users.account_id', 'accounts.id']
    ))
    // Outputs:
    select * from `users` having exists (select * from `accounts` where `users`.`account_id` = `accounts`.`id`)

    qb.from('users').having(id, 2).andHavingNotExists(qb => {
      qb.select('*').from('accounts').whereRaw(
        '?? = ??',
        ['users.account_id', 'accounts.id']
      )
    })
    // Outputs:
    select * from `users` having `id` = 2 and having not exists (select * from `accounts` where `users`.`account_id` = `accounts`.`id`)
  ```
  + .havingBetween(column: string, range: array)
  + .orHavingBetween(~mixed~)
  + .andHavingBetween(~mixed~)
  + .havingNotBetween(~mixed~)
  + .orHavingNotBetween(~mixed~)
  + .andHavingNotBetween(~mixed~)

  ```JavaScript
    qb.from('users').havingBetween('votes', [1, 100])
    // Outputs:
    select * from `users` having `votes` between 1 and 100

    qb.from('users').havingNotBetween('votes', [1, 100])
    // Outputs:
    select * from `users` having `votes` not between 1 and 100
  ```

  + .havingRaw(query, [bindings])

  Convenience helper for .having(qb.raw(query, bindings)).

  ```JavaScript
    qb.from('users').havingRaw('id = ?', [1])
    // Outputs:
    select * from `users` having id = 1

    // arrays must be passed as arguments within a containing array.
    qb.from('users').havingRaw('id in (?)', [[1, 2, 3]])
    // Outputs:
    select * from `users` having id in (1, 2, 3)
  ```
+ **offset**

  + .offset(value)

  ```JavaScript
    qb.select('*').from('users').offset(10)
    // Outputs:
    select * from `users` limit 18446744073709551615 offset 10
  ```

+ **limit**

  + .limit(value)

  ```JavaScript
    qb.select('*').from('users').limit(10).offset(30)
    // Outputs:
    select * from `users` limit 10 offset 30
  ```

+ **union**

  Creates a union query, taking an array or a list of callbacks to build
  the union statement, with optional boolean wrap.
  The queries will be individually wrapped in parentheses with a true wrap parameter.

  + .union([queries], [wrap])
  + .unionAll(query)
  ```JavaScript
    qb.select('*').from('users').whereNull('last_name').union(qb => {
      qb.select('*').from('users').whereNull('first_name');
    })
    // Outputs:
    select * from `users` where `last_name` is null union select * from `users` where `first_name` is null

    qb.select('*').from('users').whereNull('last_name').unionAll(qb => {
      qb.select('*').from('users').whereNull('first_name');
    })
    // Outputs:
    select * from `users` where `last_name` is null union all select * from `users` where `first_name` is null
  ```

+ **insert**

  + .insert(data, [returning])
  Creates an insert query, taking either a hash of properties to be inserted into the row, or an array of inserts, to be executed as a single insert command. Resolves the promise / fulfills the callback with an array containing the first insert id of the inserted model, or an array containing all inserted ids for postgresql.

  ```JavaScript
    // Returns [1] in "mysql", "sqlite", "oracle"; [] in "postgresql" unless the 'returning' parameter is set.
    qb.table('books').insert({title: 'Slaughterhouse Five'})
    // Outputs:
    insert into `books` (`title`) values ('Slaughterhouse Five')

    // Normalizes for empty keys on multi-row insert:
    qb.table('coords').insert([{x: 20}, {y: 30},  {x: 10, y: 20}])
    // Outputs:
    insert into `coords` (`x`, `y`) values (20, DEFAULT), (DEFAULT, 30), (10, 20)

    qb.table('coords').insert([{x: 20}, {y: 30}, {x: 10, y: 20}])
    // Outputs
    insert into `coords` (`x`, `y`) values (20, NULL), (NULL, 30), (10, 20)"

    // Returns [2] in "mysql", "sqlite"; [2, 3] in "postgresql"
    qb.insert([{title: 'Great Gatsby'}, {title: 'Fahrenheit 451'}], 'id').into('books')
    // Outputs:
    insert into `books` (`title`) values ('Great Gatsby'), ('Fahrenheit 451')
    ```

+ **update**

  Creates an update query, taking a hash of properties or a key/value pair to be updated based on the other query constraints. Resolves the promise / fulfills the callback with the number of affected rows for the query. If a key to be updated has value undefined it is ignored.
  + .update(data)
  + .update(key, value)

  ```JavaScript
    qb.table('books')
    .where('published_date', '<', 2000)
    .update({
      status: 'archived',
      thisKeyIsSkipped: undefined
    })
    // Outputs:
    update `books` set `status` = 'archived' where `published_date` < 2000

    qb.table('books').update('title', 'Slaughterhouse Five')
    // Outputs:
    update `books` set `title` = 'Slaughterhouse Five'
  ```

+ **del**

  Aliased to del as delete is a reserved word in JavaScript, this method deletes one or more rows, based on other conditions specified in the query. Resolves the promise / fulfills the callback with the number of affected rows for the query.
  + .del()

  ```JavaScript
    qb.table('accounts')
      .where('activated', false)
      .del()
    // Outputs:
    delete from `accounts` where `activated` = false
  ```
+ **count**

  + .count(column)
  + .countDistinct(column)
  Performs a count on the specified column. Note that in Postgres, count returns a bigint type which will be a String and not a Number (more info).

  ```JavaScript
    qb.table('users').count('active')
    // Outputs:
    select count(`active`) from `users`

    qb.table('users').count('active as a')
    // Outputs:
    select count(`active`) as `a` from `users`

    qb.table('users').countDistinct('active')
    // Outputs:
    select count(distinct `active`) from `users`
  ```
+ **min**

  + .min(column)
  Gets the minimum value for the specified column.

  ```JavaScript
    qb.from('users').min('age')
    // Outputs:
    select min(`age`) from `users`
    qb.from('users').min('age as a')
    // Outputs:
    select min(`age`) as `a` from `users`
  ```
+ **max**

  + .max(column)
  Gets the maximum value for the specified column.

  ```JavaScript
    qb.from('users').max('age')
    // Outputs:
    select max(`age`) from `users`
    qb.from('users').max('age as a')
    // Outputs:
    select max(`age`) as `a` from `users`
  ```

+ **sum**

  + .sum(column)
  + .sumDistinct(column)
  Retrieve the sum of the values of a given column.

  ```JavaScript
    qb.from('users').sum('products')
    // Outputs:
    select sum(`products`) from `users`

    qb.from('users').sum('products as p')
    // Outputs:
    select sum(`products`) as `p` from `users`

    qb.from('users').sumDistinct('products')
    // Outputs:
    select sum(distinct `products`) from `users`
  ```
+ **avg**

  + .avg(column)
  + .avgDistinct(column)
  Retrieve the average of the values of a given column.

  ```JavaScript
    qb.from('users').avg('age')
    // Outputs:
    select avg(`age`) from `users`

    qb.from('users').avg('age as a')
    // Outputs:
    select avg(`age`) as `a` from `users`

    qb.from('users').avgDistinct('age')
    // Outputs:
    select avg(distinct `age`) from `users`
  ```
