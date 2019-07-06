# *T*emplate *E*xpressio*n* *to* *AST* (tentoast)
Experimental package, inspired by unified, for creating custom (abstract) syntax trees using javascript template strings.

# About the Trees
Just like a [unist](https://github.com/syntax-tree/unist), nodes are objects containing a string `type` field and optionally a `children` array (all "parent" nodes should have it set, even if it's empty). Nodes should use the `value` field if they have one and should not use the `data` field.

Unlike unists though, the tree roots are simply arrays, making it easier to merge them together at the same level without losing any potential associated fields.

# Usage
Import the package and create an instance, optionally providing configuration:

```javascript
import tentoast from 'tentoast'

const ttt = tentoast({
  // Defaults:
  converter: (val) => val, // Should return an array of nodes/ values, can return a single node/ non-array value.
  noSmartText: false,
  providers: {
    s: sectionProvider
  }
})
```

The returned function can then be used as a tag for template strings:

```javascript
const tree = ttt`This is some ${'text'}. And here are some ${{type: 'strong', children: [{type: 'text', value: 'nodes'}]}}${{type: 'text', value: '!'}}`
```

The function runs all the template values through `converter`, merges the results together, and then converts any non-nodes to text nodes with a value of `String(value)`. Finally, any neighboring text nodes are merged together and empty ones are removed (assuming `noSmartText` isn't truthy). The example above would return (with defaults):

```json
[
  {
    "type": "text",
    "value": "This is some text. And here are some "
  },
  {
    "type": "strong",
    "children": [
      {
        "type": "text",
        "value": "nodes"
      }
    ]
  },
  {
    "type": "text",
    "value": "!"
  }
]
```



# Node Interaction Providers
Tentoast also provides a nice way to expose other functions that interact with nodes but rely on tentoast functionality via the `providers` option. These should be functions that consume a tentoast instance and options object and return a value (generally a function) to be exposed on the instance under the same key as their provider from `options`. If you want to minimize typing while using these, you can always add a bit of boilerplate:

```javascript
const {s, ps, ...} = ttt
```

These are the defaults (providers are also exported from the package), you can add/ override them with your own:

## Sections (`s`: `sectionProvider`)
This produces `section` nodes composed of one `section-header` and one `section-body` children. The initial call passes the parameters to the tentoast instace to get the header children and returns a function that consumes the body arguments to produce the full section node in an array. For example:

```javascript
const tree = 
ttt.s`This is a Section Header``\
This is the body!
It would usually have many lines, or possibly other ${{type: 'text', value: 'things.'}}`
```

produces:

```json
[
  {
    "type": "section",
    "children": [
      {
        "type": "section-header",
        "children": [
          {
            "type": "text",
            "value": "This is a Section Header"
          }
        ]
      },
      {
        "type": "section-body",
        "children": [
          {
            "type": "text",
            "value": "This is the body!\nIt would usually have many lines, or possibly other things."
          }
        ]
      }
    ]
  }
]
```

For reference on creating your own interaction providers, here's the whole source for `sectionProvider`:

```javascript
function sectionProvider(ttt, options) {
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
```



# Helper Functions
The tentoast package also exports a few helper functions that are used internally:

## `isNode(value)`
Determines if a value is a node.

## `massageToArray(value)`
Returns `value` if it's an array, otherwise returns `[ value ]`.