klayjs-svg
=== 

A simple SVG generator for JSON graphs laid out 
with [klayjs](https://github.com/OpenKieler/klayjs)
that requires no further dependencies.
We mainly use it for debugging and rapid prototyping.

For more complex use cases using [D3.js](https://d3js.org/) 
should be more suitable. 

Usage 
===

If you want to use it in the browser, 
consider using [browserify](browserify.org). 
If you want to use it on the command line, 
there's another module [klayjs-svg-cli](https://github.com/OpenKieler/klayjs-svg-cli).

Apart from that do:

```
npm install klayjs-svg
```
```
var klaysvg = require('klayjs-svg');

var renderer = new klaysvg.Renderer();
var svg = renderer.toSvg(graph);
console.log(svg);
```

It helps the renderer to know which 
layout options have been used, e.g. 
to properly render edges either 
with polylines or paths (splines).

```
var opts = { edgeRouting: "SPLINES" };
renderer.usedLayoutOptions(opts)
```

The generated SVG elements can be styled using css. 
A simple style definition is already included and used as 
default. 
Each SVG element's id equals the id in the json graph. 
Additionally, nodes, edges, ports and labels 
receive a class attribute equal to their type (e.g. `.node`). 

Custom styles and svg definitions can be specified as follows, 
note that you explicitly have to include the default style 
if you add further styles.
```
var customstyles = ['...', '...'];
renderer.styles([klaysvg.styles.simple].concat(customstyles));
renderer.defs(...);
```

It is possible to specify further attributes, classes, and styles 
as part of the json graph. A node definition like this
```
[...]
{
  "id": "node1",
  "class": ["myClass", "otherClass"],
  "attributes": {
    "data-foo": "bar",
    "rx": 5
  },
  "style": "fill: #ddd;"
}
```
results in a corresponding svg element 
```
<rect id="node1" class="myClass otherClass node" x="0" y="0" width="0" height="0" style="fill: #ddd;" data-foo="bar" rx="5" />
```


Example
=== 
Using the [CLI]((https://github.com/OpenKieler/klayjs-svg-cli)) 
and `examples/simple.json`:
```
klayjs-svg -acp < simple.json > simple.svg
```

![Simple SVG](https://cdn.rawgit.com/OpenKieler/klayjs-svg/master/examples/simple.svg)