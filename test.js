import tentoast from './index.js'

const ttt = tentoast({})

const tree = ttt`This is some ${'text'}. And here are some ${{type: 'strong', children: [{type: 'text', value: 'nodes'}]}}${{type: 'text', value: '!'}}`

console.log(JSON.stringify(tree, null, 2))