import InsituVis from './index.js';
import * as d3 from 'd3';
import {event as d3event} from 'd3';
import {bin} from 'vega-statistics';

export default class Histogram extends InsituVis {
  constructor(token) {
    super(token);
    this.state = Object.assign({}, this.state, {
      type: 'data-set-snapshot',
      max_bins: 6,
      num_bins: 6,
      padding: 1
    });

    // Create the drawing canvas.
    this.state.svg = d3.select(this.state.domNode)
        .attr('class', 'insitu histogram')
      .append('g')
        .style('width', this.state.width-this.state.padding + 'px')
        .style('height', this.state.height-this.state.padding + 'px')
        .style('overflow', 'visible');
  }

  formatData(values, map) {
    var data;
    if(typeof values[0] === 'number') {

      // Use Vega to compute the bin threasholds
      var extent = d3.extent(values);
      if(!this.state.bins/* || this.state.bins[this.state.bins.length - 1] < extent[1]*/) {
        var options = {
          extent: extent, 
          maxbins: this.state.max_bins,
          nice: true
        };
        var histogram = bin(options);

        this.state.bins = [];
        var value = histogram.start;
        while(value <= histogram.stop) {
          this.state.bins.push(value);
          value += histogram.step;
        }

        if(this.state.bins.length === 0) this.state.bins = options.extent;
      }
      
      data = d3.layout.histogram().bins(this.state.bins)(values);

    } else {
      var modified_data = values.map(map);
      data = d3.layout.histogram().bins(this.state.num_bins)(modified_data);
      
      // Redo the layout if we need to reduce the number of bins
      // if(this.state.bins > this.state.max_bins) {

      //   data.sort(function(a,b) { return b.length - a.length; });
      //   var dataNew = data.splice(0, this.state.max_bins);

      //   // Create an extra bin containing all the others that are outside the accepted range
      //   var extra = [].concat.apply([], data);
      //   extra.x = -1;
      //   extra.y = Math.max.apply(null, dataNew.map(function(d) { return d.y; }));
      //   extra.dx = dataNew[0].dx;

      //   // Create the final histogram data
      //   data = [extra].concat(dataNew);
      // }

      // Add a label for the count for what to display.
      var label = function(d) {
        var index = map.range().indexOf(d[0]);
        d.binName = map.domain()[index];
        d.label = d.length; 
      };
      data.forEach(label.bind(this));

      // Update the bins and x
      // var domain = data.map(function(val) { return val.x; });
      // this.state.x = d3.scale.ordinal().domain(domain);
      // this.state.bins = this.state.max_bins + 1;
      // var offset = function(x, i) { return i*(this.state.width / this.state.bins); };
      // this.state.x.range(this.state.x.domain().map(offset.bind(this)));

    }
    return data;
  }

  render(values) {
    this.state.values = values;

    // Compute the histogram format
    var width = function(d, i) { return i*(this.state.width/this.state.num_bins); };
    var data;
    if(typeof values[0] === 'number') {
      // x = d3.scale.linear().domain(d3.extent(values)).range([0, this.state.width]); // TODO?
      data = this.formatData(values, x);
      this.state.num_bins = this.state.bins.length - 1;
    } else {
      var x = d3.scale.ordinal().domain(values);
      x.range(x.domain().map(width.bind(this)));
      this.state.num_bins = x.domain().length;
      data = this.formatData(values, x);
    }

    // Encoding functions
    var max = d3.max(data, function(d) { return d.y; });
    this.state.y = d3.scale.linear()
        .domain([0, max])
        .range([this.state.height, 0]);
    var height = function(d) { 
      var h = (d.x !== -1) ? d.y: Math.min(d.y, d.length);
      var height = this.state.height - this.state.padding*2 - this.state.y(h);
      return Math.max(height, 0);
    };
    var yOffset = function(d) { 
      var h = (d.x !== -1) ? d.y : Math.min(d.y, d.length);
      return this.state.y(h); 
    };
    var color = function(d) { return (d.x !== -1) ? this.state.color(0.9) : 'black'; };

    var barWidth = (this.state.width-this.state.padding*2) / this.state.num_bins;
    
    // Create an svg for each bar
    var bars = this.state.svg.selectAll('.bar').data(data);
    bars.enter().append('svg')
        .attr('class', 'bar')
        .attr('height', this.state.height-this.state.padding*2)
        .style('overflow', 'visible')
      .on('mouseover', this.mouseover)
      .on('mouseout', this.mouseout)
      .on('mouseover.filter', this.shift_mouseover)
      .on('mouseout.filter', this.shift_mouseout);

    bars
        .attr('width', barWidth)
        .attr('x', width.bind(this));

    bars.exit().remove();

    // Create a rect for each svg element
    var rects = bars.selectAll('rect').data(function(d, i) { return [d]; });
    rects.enter().append('rect').style('fill', color.bind(this));

    rects
        .attr('width', barWidth - this.state.padding)
        .attr('height', height.bind(this))
        .attr('y', yOffset.bind(this));

    rects.exit().remove();
  }

  renderFiltered(values, filtered) {
    var width = function(d, i) { return i*(this.state.width/this.state.bins); };

    // Compute the x scale
    if(typeof values[0] === 'number') {
      this.state.x = d3.scale.linear().domain(d3.extent(values)).range([0, this.state.width]);
    } else {
      this.state.x = d3.scale.ordinal().domain(values);
      this.state.bins = this.state.x.domain().length;
      this.state.x.range(this.state.x.domain().map(width.bind(this)));
    }

    var data = this.formatData(values, this.state);
    var max = d3.max(data, function(d) { return d.y; });

    // Encoding functions
    this.state.y = d3.scale.linear()
        .domain([0, max])
        .range([this.state.height, 0]);
    var height = function(d) { 
      var h = (d.x !== -1) ? d.y: Math.min(d.y, d.length);
      var height = this.state.height - this.state.padding*2 - this.state.y(h);
      return Math.max(height, 0);
    };
    var yOffset = function(d) { 
      var h = (d.x !== -1) ? d.y : Math.min(d.y, d.length);
      return this.state.y(h); 
    };
    var color = function(d) { return (d.x !== -1) ? this.state.color(0.9) : 'black'; };

    // Create the bars
    var barWidth = (this.state.width-this.state.padding*2) / this.state.bins - this.state.padding;
    var bars = this.state.svg.selectAll('.bar')
        .data(data)
        .attr('width', barWidth)
        .attr('height', height.bind(this))
        .attr('x', width.bind(this))
        .attr('y', yOffset.bind(this));
    
    bars.enter().append('rect')
        .attr('class', 'bar')
        .style('fill', color.bind(this))
      .on('mouseover', this.mouseover)
      .on('mouseout', this.mouseout)
      .on('mouseover.filter', this.shift_mouseover)
      .on('mouseout.filter', this.shift_mouseout);

    bars.exit().remove();
  }

  label(svg, text, position) {
    var padding = 4;

    // Draw the label and background.
    var background = svg.append('rect')
        .attr('class', 'histogram-label')
        .attr('height', position.height)
        .attr('y', position.y - position.height)
        .style('fill', this.state.color(0.9))
        .style('rx', 2)
        .style('ry', 2)
        .style('pointer-events', 'none')
        .style('opacity', 0.8);

    var textElement = svg.append('text')
        .text(text)
        .attr('class', 'histogram-label')
        .attr('y', position.y - padding)
        .style('font-size', '7pt')
        .style('font-family', 'monospace')
        .style('pointer-events', 'none')
        .style('fill', 'white');

    // Update the position of the text and background.
    var textWidth = textElement[0][0].getBBox().width;
    textElement
        .attr('x', position.x - textWidth/2);
    background
        .attr('width', textWidth + (2*padding))
        .style('x', position.x - (textWidth + 2*padding)/2);
  }

  mouseover(d) {
    d3.select(this).style('background-color', '#ddd');
    d3.select(this).selectAll('rect').style('opacity', 0.5);
    d3.select(this.parentNode.parentNode).style('z-index', 1);
    
    var context = d3.select(this.parentNode.parentNode).datum();
    var yOffset = function(d) { 
      var h = (d.x !== -1) ? d.y : Math.min(d.y, d.length);
      return context.state.y(h); 
    };
    var height = 14;
    var padding = 2;

    // Draw the label for the count of the bin
    var center = (context.state.width / context.state.num_bins) / 2;
    var position = {
      'x': center,
      'y': -padding,
      'height': height
    };
    var text = 'count: ' + (d.label ? d.label : d.y);
    context.label(d3.select(this), text, position);

    // Draw a label for the range of the bin.
    //var domain = context.state.x.domain();
    //var value = domain[domain.indexOf(d.x) % (domain.length / 2)];
    var value = d.x;
    if(d.x === -1) {
      value = 'other';
    } else if(d.binName) {
      value = d.binName;
    } else if(typeof value !== 'string') {
      var min = Number.isInteger(d.x) ? d.x : d.x.toFixed(3);
      var max = Number.isInteger(d.x + d.dx) ? d.x + d.dx : (d.x + d.dx).toFixed(3);
      value = min !== max ? '[ ' + min + ', ' + max + ' ]' : min;
    }
    var repr = context.state.token.representation;
    if(repr) value = repr + ': ' + value;
    position.y = context.state.height + height;
    context.label(d3.select(this), value, position);
  }

  mouseout(d) {
    d3.select(this).style('background-color', 'transparent');
    d3.select(this).selectAll('rect').style('opacity', 1);
    d3.select(this.parentNode.parentNode).style('z-index', 'initial');

    var context = d3.select(this.parentNode.parentNode).datum();
    d3.select(context.state.domNode).selectAll('.histogram-label').remove();
  }

  shift_mouseover(d) {
    if(d3event.shiftKey) {
      var context = d3.select(this.parentNode.parentNode).datum();
      // Determine the range of the bin.
      var domain = context.state.x.domain();
      var range = domain[domain.indexOf(d.x) % (domain.length / 2)];
      var property = context.state.property;
      var dataset = context.state.dataset;
      d3.selectAll('.histogram')[0].forEach(function(element) {
        var vis = d3.select(element).datum();
        if(vis.state.dataset !== dataset) return; // Only filter visualizations from the same dataset.
        var original = vis.state.values;
        // TODO!!
        // In order to do this kind of filtering, each vis needs to have the FULL dataset,
        // not just the values extracted from it. (Or we need to be able to call back out to
        // the annotator in order to request a filtered version. We can maybe try something with
        // a callback to let the annotator know. There is the possibility this would be easier
        // if we were actually using react...)
      });
      console.log('shift histogram', domain, d.x, range, property, dataset)
      // var filter = function(value) { return value[property] === range; };
      // if(typeof range !== 'string') {
      //   var min = (d.x).toFixed(2);
      //   var max = (d.x + d.dx).toFixed(2);
      //   filter = function(value) { return min <= value[property] && value[property] <= max; };
      // }
      // context.renderFiltered(filter);
    }
  }

  shift_mouseout(d) {
    // TODO!!!
    // d3.selectAll(".data-div")[0].forEach(function(d) {
    //   var inst = histogram.getInstance(d3.select(d));
    //   d3.select(d).selectAll("rect")
    //       .style("stroke", debug.config.color.lightGray)
    //       .style("stroke-width", "0.5px")
    //       .style("fill", function(d) {
    //         if(d.x == -1) return "black";
    //         var max = d3.max(inst.data, function(d) { return d.y; });
    //         return inst.color(0.95);
    //       });

    //   // Create the filtered bars
    //   d3.selectAll(".filteredHistogram").remove();
    // });
  }

}