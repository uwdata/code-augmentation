import InsituVis from './index.js';
import * as d3 from 'd3';
import {event as d3event} from 'd3';

export default class Line extends InsituVis {
  constructor(token) {
    super(token);

    this.state = Object.assign({}, this.state, {
      type: 'data-value-sequence',
      padding: 1
    });

    // Create the drawing canvas.
    this.state.svg = d3.select(this.state.domNode)
        .attr('class', 'insitu line-vis')
      .append('svg')
        .attr('width', this.state.width-this.state.padding)
        .attr('height', this.state.height-this.state.padding*2)
        .style('overflow', 'visible');

    // Create the original line.
    this.state.svg.append('path')
        .attr('class', 'line')
        .style('fill', 'none')
        .style('stroke-width', 1);
  }

  formatData(values) {
    return values.map(function(d, i) { 
      var value = (d === null || d === undefined) ? null : d;
      return {'value': value, 'index': i}; 
    });
  }

  render(values) {
    this.state.data = this.formatData(values);

    if(this.state.data.length === 0) return; // TODO!!

    var x = d3.scale.linear()
        .domain(d3.extent(this.state.data, function(d) { return d.index; }))
        .range([0, this.state.width-this.state.padding]);
    this.x = x;

    var y;
    if(typeof this.state.data[0].value === 'string') {
      y = d3.scale.ordinal()
          .domain(this.state.data.map(function(d) { return d.value; }))
          .rangePoints([this.state.height-this.state.padding*2, this.state.padding*2]);
    } else {
      y = d3.scale.linear()
          .domain(d3.extent(this.state.data, function(d) { return d.value; }))
          .range([this.state.height-this.state.padding*2, this.state.padding*2]);
    }
    
    var path = d3.svg.line()
        .x(function(d) { return x(d.index); })
        .y(function(d) { return y(d.value); })
        .defined(function(d) { return d.value !== null; });

    d3.select(this.state.domNode)
      .on('mousemove', this.mousemove)
      .on('mouseout', this.mouseout)
      .on('mousemove.shift', this.shift_mousemove);
    d3.select('body')
      .on('keydown.line', this.shift_keydown)
      .on('keyup.line', this.shift_keyup);

    this.state.svg.select('.line')
        .datum(this.state.data)
        .attr('d', path)
        .style('stroke', this.state.color(0.9));

    // if(!model.current.pulse) return; // TODO: This isn't great.
    // var index = getVisibleIndexForPulse();
    // var currentPoint = data.filter(function(point) { return point.index == index })[0];

    // if(!currentPoint) return; // TODO: This isn't great. Happens when there is a signal whose value doesn't change.
    // svg.append('circle')
    //     .attr('cx', x(currentPoint.index))
    //     .attr('cy', y(currentPoint.value))
    //     .attr('r', 1.5)
    //     .style('fill', (COLOR == 'REDUNDANT') ? this.state.color(1 - y(currentPoint.value) / height) : this.state.color(0.95));

    // if(insitu.options.HOVER) changeOpacity(div);
  }

  cursor(index, value) {
    // Create the cursor.
    var xPos = this.x(index);
    var position = [
      {'x': xPos, 'y': 0}, 
      {'x': xPos, 'y': this.state.height - this.state.padding}
    ];
    
    var path = d3.svg.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });

    // Draw the cursor.
    var cursor = this.state.svg.selectAll('.cursor.line').data([position]);
    cursor.enter().append('path')
        .attr('class', 'cursor line')
        .style('stroke', this.state.color(0.9))
        .style('stroke-width', 1)
        .style('pointer-events', 'none');
    cursor.attr('d', path)

    // Draw the background.
    var height = 12;
    var padding = 3;
    var background = this.state.svg.selectAll('.cursor.background').data([position]);
    background.enter().append('rect')
        .attr('class', 'cursor background')
        .attr('height', height)
        .attr('y', -height)
        .style('rx', 2)
        .style('ry', 2)
        .style('fill', this.state.color(0.9))
        .style('opacity', 0.9);
    background.exit().remove();

    // Draw the cursor text.
    var string = this.valueToString(value);
    var text = this.state.svg.selectAll('.cursor.text')
        .data([string]);
    text.enter().append('text')
        .attr('class', 'cursor text')
        .attr('y', -padding)
        .style('fill', 'white')
        .style('font-size', '7pt')
        .style('font-family', 'monospace');
    text.text(string)
    text.exit().remove();

    // Update the position of the text and background.
    var widthPad = 10;
    var textWidth = text[0][0].getBBox().width;
    text.attr('x', xPos - textWidth/2);
    background.attr('width', textWidth + widthPad)
        .style('x', xPos - (textWidth + widthPad)/2)
  }

  mousemove() {
    d3.select(this).style('z-index', 1);

    var context = d3.select(this).datum();
    var index = Math.round(context.x.invert(d3event.layerX));
    var value = context.state.data.filter(function(value) { return value.index === index; });
    context.cursor(index, value[0].value);
  }

  mouseout() {
    d3.select(this).style('z-index', 'initial');

    d3.selectAll('.cursor').remove();
  }

  shift_mousemove(d) {
    if(d3event.shiftKey) {
      var context = d3.select(this).datum();

      // Execute mousemove event on all other line visualizations.
      d3.selectAll('.line-vis')[0].forEach(function(element) {
        if(element !== context.state.domNode) {
          var event = document.createEvent('SVGEvents');
          event.initEvent('mousemove',true,true);
          event.layerX = d3event.layerX;
          element.dispatchEvent(event);
          d3.select(element).selectAll('.cursor')
              .attr('class', function(d) {
                return d3.select(this).attr('class') + ' linked';
              });

          d3.select(element).selectAll('.cursor.line')
              .style('stroke', '#bbb');
          d3.select(element).selectAll('.cursor.background')
              .style('fill', 'white');
          d3.select(element).selectAll('.cursor.text')
              .style('fill', '#bbb');
        }
      });
    }
  }

  shift_keydown(d) {
    // console.log('keydown', d3event.layerX)
    // TODO! Put something here. The below doesn't work
    // var event = document.createEvent('SVGEvents');
    // event.initEvent('mousemove.shift',true,true);
    // event.layerX = d3event.layerX;
    // this.dispatchEvent(event);
  }

  shift_keyup(d) {
    d3.selectAll('.cursor.linked').remove();
  }

}