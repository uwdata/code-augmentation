import InsituVis from './index.js';
import * as d3 from 'd3';

export default class Heatmap extends InsituVis {
  constructor(token) {
    super(token);
    this.state = Object.assign({}, this.state, {
      type: 'data-set-snapshot',
      bins: 7,
      padding: 2
    });

    // Create the drawing canvas.
    this.state.svg = d3.select(this.state.domNode)
      .append('svg')
        .attr('width', this.state.width-this.state.padding)
        .attr('height', this.state.height-this.state.padding)
        .style('overflow', 'visible')
        .style('position', 'absolute')
        .style('padding', '1px');
  }

  formatData(values) {
    var data = [];
    if(typeof values[0] === 'number') {
      if(this.state.bins === 0) this.state.bins = 7;
      data = d3.layout.histogram().bins(this.state.bins)(values);
      var bins = [];
      data.forEach(function(bin) { if(bin.y !== 0) bins.push(bin); });
      if(bins.length === 1) {
        data = bins;
        this.state.bins = 1;
      }
    } else {
      data = d3.layout.histogram().bins(this.state.bins)(values.map(this.state.x));

      // Add a label for the count for what to display.
      var label = function(d) {
        var index = this.state.x.range().indexOf(d[0]);
        d.binName = this.state.x.domain()[index];
        d.label = d.length; 
      };
      data.forEach(label.bind(this));
    }
    return data;
  }

  render(values) {
    // Compute the x scale
    var offset = function(x, i) { return i*((this.state.width - this.state.padding) / this.state.bins); };
    if(typeof values[0] === 'number') {
      this.state.scale = 'linear';
      this.state.x = d3.scale.linear().domain(d3.extent(values)).range([0, this.state.width-this.state.padding]);
    } else {
      this.state.scale = 'ordinal';
      this.state.x = d3.scale.ordinal().domain(values);
      this.state.bins = this.state.x.domain().length;
      this.state.x.range(this.state.x.domain().map(offset.bind(this)));
    }

    var data = this.formatData(values);

    // Helper functions
    var max = d3.max(data, function(d) { return d.y; });
    var x = function(d) { return this.state.x(d.x); };
    var color = function(d) { 
      return this.state.color((d.y / max)*0.5 + 0.5); 
    };

    // Draw the heatmap
    var bars = this.state.svg.selectAll('.bar')
        .data(data)
        .style('fill', color.bind(this))
        .style('stroke', color.bind(this))
        .style('stroke-width', this.state.padding);

    var barWidth = (this.state.width-this.state.padding) / this.state.bins - this.state.padding;
    var barHeight = this.state.height-this.state.padding*2;
    bars.enter().append('rect')
        .attr('class', 'bar')
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('x', x.bind(this))
        .style('fill', color.bind(this))
        .style('stroke', color.bind(this))
      .on('mouseover', this.mouseover)
      .on('mouseout', this.mouseout);

    bars.exit().remove();
  }

  label(text, position) {
    // Draw the label and background.
    var background = this.state.svg.append('rect')
        .attr('class', 'heatmap-label')
        .attr('height', position.height)
        .attr('y', position.y - position.height)
        .style('fill', 'white')
        .style('opacity', 0.9);

    var textElement = this.state.svg.append('text')
        .text(text)
        .attr('class', 'heatmap-label')
        .attr('y', position.y - this.state.padding)
        .style('font-size', '6pt')
        .style('fill', this.state.color(1));

    // Update the position of the text and background.
    var textWidth = textElement[0][0].clientWidth;
    textElement.attr('x', position.x - textWidth/2);
    background.attr('width', textWidth + (2*this.state.padding))
        .style('x', position.x - (textWidth + 2*this.state.padding)/2);
  }

  mouseover(d) {
    d3.select(this).style('stroke', 'white');
    d3.select(this.parentNode.parentNode).style('z-index', 1);

    var context = d3.select(this.parentNode.parentNode).datum();
    var height = 12;

    // Draw the label for the count of the bin
    var center = (context.state.width / context.state.bins) / 2;
    var x = context.state.scale === 'linear' ? context.state.x(d.x) : d[0];
    var position = {'x': x + center, 'y': -context.state.padding, 'height': height};
    var text = d.label ? d.label : d.y;
    context.label(text.toString(), position);

    // Draw a label for the range of the bin.
    var domain = context.state.x.domain();
    var value = domain[domain.indexOf(d.x) % (domain.length / 2)];
    if(d.binName) {
      value = d.binName;
    } else if(typeof value !== 'string') {
      var min = (d.x).toFixed(0); // TODO!!!
      var max = (d.x + d.dx).toFixed(0); // TODO!!!
      value = '[' + min + ', ' + max + ']';
    }
    var repr = context.state.token.representation;
    if(repr) value = repr + ': ' + value;
    position.y = context.state.height + height + context.state.padding;
    context.label(value, position);
  }

  mouseout(d) {
    d3.select(this).style('stroke', d3.select(this).style('fill'));
    d3.select(this.parentNode.parentNode).style('z-index', 'initial');

    var context = d3.select(this.parentNode.parentNode).datum();
    d3.select(context.state.domNode).selectAll('.heatmap-label').remove();
  }
}