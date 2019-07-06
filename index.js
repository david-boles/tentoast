// IMPLEMENTATION

const defaults = {
  converter: (val) => [val],
  noSmartText: false,
  providers: {
    s: sectionProvider
  }
}

export default function tentoast(options) {
  options = Object.assign({}, defaults, options) // Don't overwrite passed object; assigning undefined works fine

  function instance(strings, ...values) {
    // Convert values and merge with strings
    const merged = [strings[0]]
    for(let i = 1; i < strings.length; i++) {
      merged.push(...massageToArray(options.converter(values[i - 1])), strings[i]);
    }

    // Make everything into nodes
    let nodes = merged.map(value => {
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
          }else {
            nodes.push(node)
          }
        }else {
          nodes.push(node)
        }
      }
    }

    return nodes
  }

  Object.keys(options.providers).forEach(providerKey =>
    instance[providerKey] = options.providers[providerKey](instance, options))

  return instance
}



// HELPERS
export function isNode(value) {
  return typeof value === 'object' && typeof value.type === 'string'
}

export function massageToArray(array) {
  if(!Array.isArray(array)) {
    array = [ array ]
  }
  return array
}



// INTERACTION PROVIDERS

export function sectionProvider(ttt, _) {
  return function(headerStrings, ...headerValues) {
    return function(bodyStrings, ...bodyValues) {
      return [{
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
      }]
    }
  }
}