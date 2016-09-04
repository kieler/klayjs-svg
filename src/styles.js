module.exports = (function() {
  var _ = {
    simple: `
      rect {
        opacity: 0.8;
        fill: #6094CC;
        stroke-width: 1;
        stroke: #222222;
      }
      rect.port {
        opacity: 1;
        fill: #326CB2;
      }

      text {
        font-size: 10px;
        font-family: Sans-Serif;
        /* in klay's coordinates "hanging" would be the correct value" */
        alignment-baseline: baseline;
        text-anchor: start; 
      }
      g.port > text {
        font-size: 8px;  
      }
      polyline {
        fill: none;
        stroke: black;
        stroke-width: 1; 
      }
      path {
        fill: none;
        stroke: black; 
        stroke-width: 1; 
      }
    `,
    
    arrows: `
      polyline {
        marker-end: url(#arrow);
      }
      path {
        marker-end: url(#arrow);
      }
    `,
    
    centerLabels: `
      text.center {
        alignment-baseline: middle;
        text-anchor: middle;
      }
    `,
  };
  _.__defaults = ["simple"];
  return _;
})();