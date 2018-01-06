import InsituVis from './index.js';
import * as d3 from 'd3';
import {event as d3event} from 'd3';

export default class Tick extends InsituVis {
  constructor(token) {
    super(token);

    this.state = Object.assign({}, this.state, {
      type: 'change-value-sequence'
    });

    // Create the drawing canvas.
    this.state.svg = d3.select(this.state.domNode).append('g')
        .attr('class', 'tick')
        .style('width', this.state.width + 'px')
        .style('height', this.state.height + 'px')
        .style('position', 'absolute')
        .style('overflow', 'visible');
  }

  formatData(values) {
    values = values.map(function(value, index) { 
      return {
        value: value,
        index: index,
        change: !(value === values[index-1])
      };
    });
    values = values.slice(1, values.length);
    return values;
  }

  render(values) {
    var data = this.formatData(values);

    var padding = 1;
    var tickWidth = (this.state.width - padding*2) / data.length - padding;
    var tickHeight = this.state.height / 2 - padding;

    // Helper functions
    var color = function(d) { return this.state.color(d.change ? 1 : 0); };
    
    // Create bars for each tick.
    var bars = this.state.svg.selectAll('.bar')
        .data(data)
        .attr('width', tickWidth + padding);
    bars.enter().append('svg')
        .attr('class', 'bar')
        .attr('id', function(d) { return 'bar' + d.index; })
        .attr('width', tickWidth + padding)
        .attr('height', this.state.height)
      .on('mouseover.basic', this.mouseover)
      .on('mouseout.basic', this.mouseout)
      .on('mouseover.filter', this.shift_mouseover)
      .on('mouseout.filter', this.shift_mouseout);
    bars.exit().remove();

    // Create rects in each tick.
    var rects = bars.selectAll('rect')
        .data(function(d, i) { return [d]; });
    rects.enter().append('rect').attr('height', tickHeight);

    rects
        .attr('y', function(d) { return d.change ? 0 : tickHeight; })
        .attr('width', this.state.width / data.length - padding)
        .style('fill', color.bind(this));

    rects.exit().remove();
  }

  label(text, position) {
    var padding = 4;

    // Draw the label and background.
    var group = d3.select(position.element).style('overflow', 'visible');

    var color = function(d) { return this.state.color(d.change ? 1 : 0); };
    var background = group.append('rect')
        .attr('class', 'cursor background')
        .attr('height', position.height)
        .attr('y', position.y - position.height)
        .attr('rx', 2)
        .attr('ry', 2)
        .style('fill', color.bind(this))
        .style('opacity', 0.9);

    var textElement = group.append('text')
        .attr('class', 'cursor text')
        .text(text)
        .attr('y', position.y - padding)
        .style('font-family', 'sans-serif')
        .style('font-size', '7pt')
        .style('fill', 'white');

    // Update the position of the text and background.
    var textWidth = textElement[0][0].clientWidth;
    textElement.attr('x', position.x - textWidth/2);
    background.attr('width', textWidth + (2*padding))
        .style('x', position.x - (textWidth + 2*padding)/2);
  }

  mouseover(d) {
    d3.select(this).selectAll('rect').style('opacity', 0.5);
    d3.select(this.parentNode.parentNode).style('z-index', 1);

    var context = d3.select(this.parentNode.parentNode).datum();
    var height = 14;
    var center = d3.select(this)[0][0].clientWidth / 2;
    var padding = 2;
    var position = {
      'element': this,
      'x': center, 
      'y': -padding,
      'height': height
    };
    context.label(context.valueToString(d.value), position);
  }

  mouseout(d) {
    d3.select(this).selectAll('rect').style('opacity', 1);
    d3.select(this.parentNode.parentNode).style('z-index', 'initial');

    var context = d3.select(this.parentNode.parentNode).datum();
    d3.select(context.state.domNode).selectAll('.cursor').remove();
  }

  shift_mouseover(d) {
    if(d3event.shiftKey) {
      var context = d3.select(this.parentNode.parentNode).datum();
      d3.selectAll('.tick')[0].forEach(function(element) {
        if(element.parentNode !== context.state.domNode) {
          var bar = d3.select(element.parentNode).selectAll('#bar' + d.index)[0][0];
          var event = document.createEvent('SVGEvents');
          event.initEvent('mouseover',true,true);
          bar.dispatchEvent(event);

          d3.select(element).selectAll('.cursor.background')
              .style('fill', 'white');
          var color = function(d) { return this.state.color(d.change ? 1 : 0); };
          d3.select(element).selectAll('.cursor.text')
              .style('fill', color.bind(context));
        }
      });
    }
  }

  shift_mouseout(d) {
    d3.select('body').selectAll('.cursor').remove();
    var context = d3.select(this.parentNode.parentNode).datum();
    d3.selectAll('.tick')[0].forEach(function(element) {
        if(element.parentNode !== context.state.domNode) {
          var bar = d3.select(element.parentNode).selectAll('#bar' + d.index);
          bar.selectAll('rect').style('opacity', 1);
          d3.select(bar[0][0].parentNode.parentNode).style('z-index', 'initial');
        }
      });
  }
}