# *T*emplate *E*xpressio*n* *to* *AST* (tentoast)
Experimental package, inspired by unified, for creating custom (abstract) syntax trees using javascript template strings.

# About the Trees
Just like a [unist](https://github.com/syntax-tree/unist), nodes are objects containing a string `type` field and optionally a `children` array (all "parent" nodes should have it set, even if its empty). Nodes should use the `value` field if they have one and should not use the `data` field.

Unlike unists though, the tree roots are simply lists, making it easier to merge them together at the same level without losing any potential associated fields.

# Usage
Import the package and create an instance, optionally providing configuration:

```javascript
import tentoast from 'tentoast'

const ttt = tentoast({
  // Defaults:
  converter: (val, fromString) => [val], // Can return either a list of nodes and values, a node, or a value. Return a list containing the value to preserve list values.
  noSmartText: false,
  providers: {
    s: sectionsProvider
  }
})
```

The returned function can then be used as a tag for template strings:

```javascript
const tree = ttt`This is some ${'text'}. And here are some ${{type: 'strong', children: [{type: 'text', value: 'nodes'}]}}${{type: 'text', value: '!'}}`
```

The function runs all the substrings (`fromString === true`) and values (`fromString === false`) through `converter` (if supplied), merges the results together, and then converts any non-nodes to text nodes with a value of `String(value)`. Finally, any neighboring text nodes are merged together and empty ones are removed (assuming `noSmartText` isn't truthy). The example above would return (with defaults):

```json
[
  {
    "type": "text",
    "value": "This is some text. And here is a "
  },
  {
    "type": "strong",
    "children": [
      {
        "type": "text",
        "value": "node"
      }
    ]
  },
  {
    "type": "text",
    "value": "!"
  }
]
```

Alternatively, the function can be called with just a list of nodes/values, a node, or a value, in which case the behavior is identical except that `fromString` is always false. For example:

```
ttt("hello")
```

Calls `converter` with `"hello", false`.

```
ttt(7)
```

Calls `converter` with `7, false`

```
ttt(["hello", "7"])
```

Calls `converter` with `"hello", false` and `7, false`.

```
ttt([["hello", "7"]])
```

Calls `converter` with `["hello", "7"], false`

> Note:
> 
> ```
> ttt(["hello"])
> ```
> 
> Calls `converter` with `"hello", true` as the arguments cannot be differentiated from
>
> ```
> ttl`hello`
> ```



# Node Interaction Providers
Tentoast also provides a nice way to expose other functions that interact with nodes but rely on tentoast functionality via the `providers` option. These should be functions that consume a tentoast instance and options object and return a value (generally a function) to be exposed on the instance under the same key. If you want to minimize typing while using these, you can always add a bit of boilerplate:

```javascript
const {s, ps, ...} = ttt
```

These are the defaults (providers are also exported from the package), you can add/ override them with your own:

## Sections (`s`: `sectionsProvider`)
This produces `section` nodes composed of one `section-header` and one `section-body` children. The initial call passes the parameters to the tentoast instace to get the header children and returns a function that consumes the body arguments to produce the full section node. For example:

```javascript
const tree = 
ttt.s`This is a Section Header``\
This is the body!
It would usually have many lines, or possibly other ${{type: 'text', value: 'things.'}}`
```

produces:

```json
{
  "type": "section" ,
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
```

Of course, you can always call the functions manually:

```
ttt.s("Header")("Body")
```

For reference on creating your own interaction providers, here's the whole source for `sectionsProvider`:

```javascript
function sectionsProvider(ttt, options) {
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