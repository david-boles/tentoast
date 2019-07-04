// IMPLEMENTATION

const defaults = {
  converter: (val, _) => [val],
  noSmartText: false,
  providers: {
    s: sectionsProvider
  }
}

export default function tentoast(options) {
  if(options !== undefined && typeof options !== 'object') {
    throw new Error('tentoast options must either be undefined or an object')
  }
  options = Object.assign({}, defaults, options) // Assigning undefined works fine; don't overwrite passed object

  function instance(strings, ...values) {
    const converted = []

    function doConvert(value, fromString) {
      const output = massageToArray(options.converter(value, fromString))
      converted.push(...output)
    }

    if(areTagInputs(strings, ...values)) { // Used as tag function
      doConvert(strings[0], true)
      for(let i = 1; i < strings.length; i++) {
        doConvert(values[i - 1], false)
        doConvert(strings[i], true)
      }
    }else { // Passed either array or single
      if(values.length === 0) {
        throw new Error('when not used as tag function, tentoast instances only accept one argument')
      } 
      values = massageToArray(strings)
      for(let value of values) {
        doConvert(value, false)
      }
    }

    // Make everything into nodes
    const nodes = converted.map(value => {
      if(isNode(value)) {
        return value
      }else {
        return {
          type: 'text',
          value: String(value)
        }
      }
    })

    // Perform smart text operations (merge nodes, remove empties)
    if(!options.noSmartText) {
      const oldNodes = nodes
      nodes = []
      for(let node of oldNodes) {
        if(node.type === 'text') {
          if(node.value === '') {
            continue
          }
          if(nodes.length > 0 && nodes[nodes.length - 1].type === 'text') {
            nodes[nodes.length - 1].value += node.value
          }
        }else {
          nodes.push(node)
        }
      }
    }

    return nodes
  }

  Object.keys(options.providers).forEach(providerKey =>
    instance[providerKey] = options[providerKey](instance, options))

  return instance
}



// HELPERS

export function areTagInputs(strings, ...values) {
  if(!Array.isArray(strings)) {
    return false
  }
  if(strings.length !== (values.length + 1)) { // Also implicitly checks for empty strings array
    return false
  }
  for(let string of strings) {
    if(typeof string !== 'string') {
      return false
    }
  }
  return true
}

export function massageToArray(array) {
  if(!Array.isArray(array)) {
    array = [ array ]
  }
  return array
}

export function isNode(value) {
  return typeof value === 'object' && typeof value.type === 'string'
}



// INTERACTION PROVIDERS

export function sectionsProvider(ttt, _) {
  return function(headerStrings, ...headerValues) {
    return function(bodyStrings, ...bodyValues) {
      return {
        "type": "section" ,
        "children": [
          {
            "type": "section-header",
            "children": ttt(headerStrings, ...headerValues)
          },
          {
            "type": "section-body",
            "children": ttt(bodyStrings, ...bodyValues)
          }
        ]
      }
    }
  }
}