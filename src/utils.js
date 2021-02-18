function getTag(src) {
  return Object.prototype.toString.call(src)
}

function hasOwnProperty(obj, keyName) {
  return Object.prototype.hasOwnProperty.call(obj, keyName)
}

function isObject(val) {
  return getTag(val) === '[object Object]'
}

function isString(val) {
  return getTag(val) === '[object String]'
}

function isBoolean(val) {
  return getTag(val) === '[object Boolean]'
}

function isNumber(val) {
  return getTag(val) === '[object Number]'
}

function isFunction(val) {
  return getTag(val) === '[object Function]'
}

function isArray(val) {
  return getTag(val) === '[object Array]'
}

function isSimpleType(val) {
  return isString(val) || isBoolean(val) || isNumber(val)
}

function isEmpty(value) {
  if (value === null || value === undefined) {
    return true
  }
  if (isArray(value) || isString(value)) {
    return value.length === 0
  }
  if (isObject(value)) {
    return Object.keys(value).length === 0
  }
  return false
}


// function is(x, y) {
//   // inlined Object.is polyfill to avoid requiring consumers ship their own
//   // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
//   if (x === y) {
//     // Steps 1-5, 7-10
//     // Steps 6.b-6.e: +0 != -0
//     // Added the nonzero y check to make Flow happy, but it is redundant
//     return x !== 0 || y !== 0 || 1 / x === 1 / y
//   } else {
//     // Step 6.a: NaN == NaN
//     return x !== x && y !== y
//   }
// }
//
// function isShallowEqual(objA, objB) {
//   if (is(objA, objB)) {
//     return true
//   }
//   if (
//     typeof objA !== 'object' ||
//     objA === null ||
//     typeof objB !== 'object' ||
//     objB === null
//   ) {
//     return false
//   }
//   const keysA = Object.keys(objA)
//   const keysB = Object.keys(objB)
//   if (keysA.length !== keysB.length) {
//     return false
//   }
//   let i = 0
//   while (i < keysA.length) {
//     if (
//       !hasOwnProperty(objB, keysA[i]) ||
//       !is(objA[keysA[i]], objB[keysA[i]])
//     ) {
//       return false
//     }
//     i += 1
//   }
//   return true
// }

function has(obj, keyName) {
  return obj !== null
    && obj !== undefined
    && hasOwnProperty(obj, keyName)
}

function map(src, func) {
  const rst = []
  let i = 0
  if (isArray(src)) {
    while (i < src.length) {
      rst.push(func(src[i], i, src))
      i += 1
    }
  } else if (isObject(src)) {
    const keys = Object.keys(src)
    while (i < keys.length) {
      const key = keys[i]
      rst.push(func(src[key], key, src))
      i += 1
    }
  }
  return rst
}

function reduce(src, func) {
  let i = 0
  let acc = arguments[2]
  if (isArray(src)) {
    if (arguments.length !== 3) {
      acc = src[0]
    }
    while(i < src.length) {
      acc = func(acc, src[i], i, src)
      i += 1
    }
    return acc
  } else if (isObject(src)) {
    const keys = Object.keys(src)
    if (arguments.length !== 3) {
      acc = src[keys[0]]
    }
    while(i < keys.length) {
      const key = keys[i]
      acc = func(acc, src[key], key, src)
      i += 1
    }
    return acc
  }
  return acc
}

function forEach(src, func) {
  let i = 0
  if (isArray(src)) {
    while(i < src.length) {
      const rst = func(src[i], i, src)
      if (rst === false) {
        break
      }
      i += 1
    }
  } else if (isObject(src)) {
    const keys = Object.keys(src)
    while(i < keys.length) {
      const key = keys[i]
      const rst = func(src[key], key, src)
      if (rst === false) {
        break
      }
      i += 1
    }
  }
}

// function findIndex(src, func) {
//   let rst = -1
//   forEach(src, (item, index, obj) => {
//     if (isFunction(func)) {
//       if (func(item, index, obj) === true) {
//         rst = index
//         return false
//       }
//     } else {
//       if (isShallowEqual(item, func)) {
//         rst = index
//         return false
//       }
//     }
//   })
//   return rst
// }
//
// const charCodeOfDot = '.'.charCodeAt(0)
// const reEscapeChar = /\\(\\)?/g
// const rePropName = RegExp(
//   // Match anything that isn't a dot or bracket.
//   '[^.[\\]]+' + '|' +
//   // Or match property names within brackets.
//   '\\[(?:' +
//     // Match a non-string expression.
//     '([^"\'].*)' + '|' +
//     // Or match strings (supports escaping characters).
//     '(["\'])((?:(?!\\2)[^\\\\]|\\\\.)*?)\\2' +
//   ')\\]'+ '|' +
//   // Or match "" as the space between consecutive dots or empty brackets.
//   '(?=(?:\\.|\\[\\])(?:\\.|\\[\\]|$))'
// , 'g')
//
// function stringToPath(string) {
//   const result = []
//   if (string.charCodeAt(0) === charCodeOfDot) {
//     result.push('')
//   }
//   string.replace(rePropName, (match, expression, quote, subString) => {
//     let key = match
//     if (quote) {
//       key = subString.replace(reEscapeChar, '$1')
//     }
//     else if (expression) {
//       key = expression.trim()
//     }
//     result.push(key)
//   })
//   return result
// }
//
// function toPath(value) {
//   if (!isString(value)) {
//     return []
//   }
//   return stringToPath(value)
// }
//
// function get(object, path, defaultValue) {
//   if (object == null) {
//     return defaultValue
//   }
//   if (!Array.isArray(path)) {
//     const reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/
//     const reIsPlainProp = /^\w*$/
//     const isKey = function(value, object) {
//       const type = typeof value
//       if (type == 'number' || type == 'boolean' || value == null) {
//         return true
//       }
//       return reIsPlainProp.test(value)
//         || !reIsDeepProp.test(value)
//         || (object != null && value in Object(object))
//     }
//     if (isKey(path, object)) {
//       path = [path]
//     } else {
//       path = stringToPath(path)
//     }
//   }
//   let index = 0
//   const length = path.length
//   while (object != null && index < length) {
//     object = object[path[index]]
//     index += 1
//   }
//   if (index && index === length) {
//     return object === undefined ? defaultValue : object
//   } else {
//     return defaultValue
//   }
// }


module.exports = {
  isObject,
  isString,
  isBoolean,
  isNumber,
  isFunction,
  isArray,
  isSimpleType,
  isEmpty,
  has,
  map,
  reduce,
  forEach,
}
