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
  // istanbul ignore else
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

function forEach(src, func) {
  let i = 0
  // istanbul ignore else
  if (isArray(src)) {
    while (i < src.length) {
      const rst = func(src[i], i, src)
      // istanbul ignore if
      if (rst === false) {
        break
      }
      i += 1
    }
  } else if (isObject(src)) {
    const keys = Object.keys(src)
    while (i < keys.length) {
      const key = keys[i]
      const rst = func(src[key], key, src)
      // istanbul ignore if
      if (rst === false) {
        break
      }
      i += 1
    }
  }
}

function toPositiveInt(num) {
  const int = Number.parseInt(num, 10)
  if (Number.isNaN(int) || int < 1) {
    return 0
  }
  return int
}

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
  forEach,
  toPositiveInt,
}
