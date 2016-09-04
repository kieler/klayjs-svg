"use strict";

const layoutOptions = require("./src/opts.js");
const styles = require("./src/styles.js");
const defs = require("./src/defs.js");

function Renderer() {
  // configuration 
  this._style = styles.__defaults.map(s => styles[s]).join("\n");
  this._defs = defs.__defaults.map(d => defs[d]).join("\n");
  
  this.reset();
}

Renderer.prototype = {
  constructor: Renderer,
  
  reset() {
    // internal housekeeping  
    this._edgeRoutingStyle = {
      __global: "POLYLINE"
    };
    this._parentIds = {};
    this._edgeParents = {};  
  },
      
  init(root) {
    // reset
    this.reset();
    this.registerParentIds(root);
    this.registerEdges(root);
  },
 
  /* Utility methods. */
  
  // edges can be specified anywhere, there coordinates however are relative
  //  a) to the source node's parent
  //  b) the source node, if the target is a descendant of the source node
  isDescendant(parent, node) {
    var current = node.id;
    while (this._parentIds[current]) {
      current = this._parentIds[current];
      if (current == parent.id) {
          return true;
      }
    }
    return false;
  },

  getOption(e, id) {
    if (!e) {
      return undefined;
    }
    if (e.id) {
      return e.id;
    } 
    var suffix = id.substr(id.lastIndexOf('.') + 1);
    if (e[suffix]) {
      return e[suffix];
    } 
    return undefined;
  },

  registerParentIds(p) {
    this._edgeParents[p.id] = [];
    if (p.properties) {
      var er = this.getOption(p.properties, layoutOptions.edgeRouting);
      if (er) {
        this._edgeRoutingStyle[p.id] = er;
      }
    }
    (p.children || []).forEach((c) => {
      this._parentIds[c.id] = p.id;
      this.registerParentIds(c);
    });
  },

  registerEdges(p) {
    (p.edges || []).forEach((e) => {
      var parent = e.source;
      if (!this.isDescendant(e.source, e.target)) {
          parent = this._parentIds[e.source];
      }
      this._edgeParents[parent].push(e);
    });
    (p.children || []).forEach(c => this.registerEdges(c));
  },

  /*
   * Rendering methods. 
   */
  
  renderRoot(root) {
    var s = this.svgHead(root);
    s += "<defs>\n";
    s += this.svgCss(root.css || this._style);
    s += root.defs ||this._defs;
    s += "</defs>";
    s += "\n";
    s += this.renderGraph(root);
    s += "\n";
    s += this.svgTail();
    return s;
  },

  renderGraph(graph) {
    var s = "";
    s += "<g transform=\"translate(" + (graph.x || 0) + "," + (graph.y || 0) +")\">";
    s += "\n";
    // paint edges first such that ports are drawn on top of them 
    s += (this._edgeParents[graph.id] || []).map((e) => { return this.renderEdge(e, graph); }).join("\n");
    s += "\n";
    s += (graph.children || []).map(c => this.renderNode(c)).join("\n");
    s += "\n";
    s += (graph.children || []).filter((c) => { return c.children != null && c.children.length > 0; })
                               .map(c => this.renderGraph(c))
                               .join("\n");
    s += "\n";
    s += "</g>";
    return s;
  },

  renderNode(node) {
    var s = "<rect ";
    s += this.idClass(node, "node");
    s += this.posSize(node);
    s += this.style(node);
    s += this.attributes(node);
    s += "/>";
    if (node.ports || node.labels) {
      s += "<g transform=\"translate(" + (node.x || 0) + "," + (node.y || 0) +")\" >";
      s += "\n";
    }
    // ports
    if (node.ports) {
      s += (node.ports || []).map(p => this.renderPort(p)).join("\n");
      s += "\n";
    }
    if (node.labels) {
      s += (node.labels || []).map(l => this.renderLabel(l)).join("\n");
      s += "\n";
    }
    if (node.ports || node.labels) {
      s += "</g>";
    }
    return s;
  },

  renderPort(port) {
    var s = "<rect ";
    s += this.idClass(port, "port");
    s += this.posSize(port);
    s += this.style(port);
    s += this.attributes(port);
    s += "/>";
    if (port.labels) {
      s += "<g class=\"port\" transform=\"translate(" + (port.x || 0) + "," + (port.y || 0) +")\" >";
      s += (port.labels || []).map(l => this.renderLabel(l)).join("\n");
      s += "</g>";
    }
    return s;
  },

  renderEdge(edge, node) {
    var allbends = [];
    if (edge.sourcePoint) {
      allbends.push(edge.sourcePoint);
    }
    if (edge.bendPoints) {
      allbends = allbends.concat(edge.bendPoints);
    } 
    if (edge.targetPoint) {
      allbends.push(edge.targetPoint);
    }
    var s = "";
    if (this._edgeRoutingStyle[node.id] == "SPLINES" || this._edgeRoutingStyle.__global == "SPLINES") {
      s += "<path ";
      s += "d=\"" + this.bendsToSpline(allbends) + "\" ";
    } else {
      s += "<polyline ";
      s += "points=\"" + this.bendsToPolyline(allbends) + "\" ";
    }
    s += this.idClass(edge, "edge");
    s += this.style(edge);
    s += this.attributes(edge);
    s += "/>";
    if (edge.labels) {
      s += (edge.labels || []).map(l => this.renderLabel(l)).join("\n");
    }
    return s;
  },

  renderLabel(label) {
    var s = "<text ";
    s += this.idClass(label);
    s += this.posSize(label);
    s += this.style(label);
    s += this.attributes(label);
    s += ">";
    s += label.text;
    s += "</text>";
    return s;
  },

  bendsToPolyline(bends) {
    var s = "";
    for (var i = 0; i < bends.length; i++) {
        s += "" + bends[i].x + "," + bends[i].y + " ";
    }
    s += "";
    return s;
  },

  bendsToSpline(cps) {
    
    let s = '';
    if (cps.length) {
      let {x, y} = cps[0];
      s += `M${x} ${y} `;
    }
    
    var i = 1;
    while (i < cps.length) {
      var left = cps.length - i;
      if (left == 1) {
        s += "L" + cps[i].x + " " + cps[i].y + " ";
      } else if (left == 2) {
        s += "Q" + cps[i].x + " " + cps[i].y + " ";
        s += "" + cps[i+1].x + " " + cps[i+1].y + " ";
      } else {
        s += "C" + cps[i].x + " " + cps[i].y + " ";
        s += "" + cps[i+1].x + " " + cps[i+1].y + " ";
        s += "" + cps[i+2].x + " " + cps[i+2].y + " ";
      }
      i += 3;
    }
    return s;
  },

  svgHead(graph) {
    var s ="<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" ";
    s += "width=\"" + (graph.width || 100) + "\" ";
    s += "height=\"" + (graph.height || 100) + "\" ";
    s += ">";
    return s;
  },

  svgTail() {
    return "</svg>\n";
  },

  svgCss(css) {
    var s = "<style type=\"text/css\">\n";
    s += "<![CDATA[\n";
    s += css;
    s += "\n]]>\n";
    s += "</style>\n";
    return s;
  },

  posSize(e) {
    var s = "";
    s += "x=\"" + (e.x || 0) + "\" ";
    s += "y=\"" + (e.y || 0) + "\" ";
    s += "width=\"" + (e.width || 0) + "\" ";
    s += "height=\"" + (e.height || 0) + "\" ";
    return s;
  },

  idClass(e, additionalClasses) {
    var s = "";
    if (e.id) {
      s += "id=\"" + e.id + "\" ";
    }
    var classes = [e.class, additionalClasses].reduce((acc, e) => {
     if (e == undefined) {
       return acc;
     } else if (typeof e === "string") {
       return acc.concat(e);
     } else if (e instanceof Array) {
       return acc.concat(e);
     } else {
       return acc;
     }
    }, []);
    if (classes.length > 0) {
      s += "class=\"" + classes.join(" ") + "\" ";
    }
    return s;
  },

  style(e) {
    var s = "";
    if (e.style) {
      s += "style=\"" + e.style + "\" ";
    }
    return s;
  },

  attributes(e) {
    var s = "";
    if (e.attributes) {
      var attrs = e.attributes;
      for (var key in attrs) {
        s += key + "=\"" + attrs[key] + "\" ";
      }
    }
    return s;
  },
  
  
  /*
   * Public API
   */
   
  styles(...styles) {
    if (styles.length == 0) 
      return this._style;
    this._style = styles.join(" ");
    return this;  
  },
  
  defs(...defs) {
    if (defs.length == 0) 
      return this._defs;
    this._defs = defs.join(" "); 
    return this;
  },
  
  /**
   * the options that have been used during layout. 
   * They are used here to derive edge routing. 
   */
  usedLayoutOptions(opts) {
    var edgeRouting = this.getOption(opts, layoutOptions.edgeRouting);
    if (edgeRouting) {
      this._edgeRoutingStyle.__global = edgeRouting;
    }
    return this;
  },
  
  toSvg(json) {
   this.init(json);
   return this.renderRoot(json);
  }
};


exports = module.exports = {
  Renderer,
  opts: layoutOptions,
  defs,
  styles
};
