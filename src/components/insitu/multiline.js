import InsituVis from './index.js';
import * as d3 from 'd3';
import {event as d3event} from 'd3';


export default class Multiline extends InsituVis {
  constructor(token) {
    super(token);

    this.state = Object.assign({}, this.state, {
      type: 'data-value-sequence-multi',
      padding: 1
    });

    // Create the drawing canvas.
    this.state.svg = d3.select(this.state.domNode)
        .attr('class', 'insitu line-vis')
      .append('svg')
        .attr('width', this.state.width-this.state.padding)
        .attr('height', this.state.height-this.state.padding*2)
        .style('overflow', 'visible');
  }

  formatData(values) {
    var lastVal = values[values.length-1];
    var data = [];
    if(lastVal instanceof Array) {
      for (var i = 0; i < lastVal.length; i++) {
        data.push({'name': i, 'values': values.map(function(val) {
          if(val[i] === null) return null;
          return val[i];
        })});
      }
    } else {
      console.error('other type!', lastVal)
    }
    return data;
  }

  render(values) {

    this.state.data = this.formatData(values);
    var allData = this.state.data.map(function(val) { return val.values; }).reduce(function(a,b) { return a.concat(b) }, []);

    if(this.state.data.length === 0) return; // TODO!!

    var x = d3.scale.linear()
        .domain([0, this.state.data[0].values.length-1])
        .range([0, this.state.width-this.state.padding]);
    this.x = x;

    var y;
    if(typeof this.state.data[0].value === 'string') {
      // TODO!!!
      console.error('multiline shouldn\'t have string type')
    } else {
      y = d3.scale.linear()
          .domain(d3.extent(allData))
          .range([this.state.height-this.state.padding*2, this.state.padding*2]);
    }
    
    var path = d3.svg.line()
        .x(function(d,i) { return x(i); })
        .y(function(d,i) { return y(d); })
        .defined(function(d) { return d !== null; });

    d3.select(this.state.domNode)
      .on('mousemove', this.mousemove)
      .on('mouseout', this.mouseout)
      .on('mousemove.shift', this.shift_mousemove);
    d3.select('body')
      .on('keydown.line', this.shift_keydown)
      .on('keyup.line', this.shift_keyup);

    var lines = this.state.svg.selectAll('.line')
        .data(this.state.data, function(data) { return data.name; });
    
    lines.enter().append('path')
        .attr('class', 'line')
        .style('fill', 'none')
        .style('stroke-width', 1);

    var max = this.state.data.length;
    var color = function(d,i) { return this.state.color(i+1/max); };
    lines
        .attr('d', function(d) { return path(d.values); })
        .style('stroke', color.bind(this));

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

  cursor(index, values) {
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
        .style('fill', '#ddd')
        .style('opacity', 0.9);
    background.exit().remove();

    // Determine the cursor text.
    var strings = [];
    for (var i = 0; i < values.length; i++) {
      strings.push(i + ':' + this.valueToString(values[i]));
    }

    var max = this.state.data.length;
    var color = function(d,i) { return this.state.color(i+1/max); };

    // Draw the cursor text.
    var textBackground = this.state.svg.selectAll('.cursor.text-background').data([position])
    textBackground.enter().append('g').attr('class', 'cursor text-background');
    textBackground.exit().remove();
    
    var text = textBackground.selectAll('.cursor.text')
        .data(strings);
    text.enter().append('text')
        .attr('id', function(d) { return d + '_string'; })
        .attr('class', 'cursor text')
        .attr('y', -padding)
        .style('fill', color.bind(this))
        .style('font-size', '7pt')
        .style('font-family', 'monospace');
    text.text(function(d) { return d; })
    text.exit().remove();

    var offset = 0;
    var padding = 6;
    for (var i = 1; i < strings.length; i++) {
      offset += text[0][i-1].getBBox().width + padding;
      d3.select(text[0][i]).attr('transform', 'translate(' + offset + ', 0)');
    };

    // Update the position of the text and background.
    var widthPad = 10;
    var textWidth = textBackground[0][0].getBBox().width;
    textBackground.attr('transform', 'translate(' + (xPos - textWidth/2) + ', 0)');
    background.attr('width', textWidth + widthPad)
        .style('x', xPos - (textWidth + widthPad)/2)
  }

  mousemove() {
    d3.select(this).style('z-index', 1);
    
    var context = d3.select(this).datum();
    var index = Math.round(context.x.invert(d3event.layerX));
    var values = context.state.data.map(function(data) {
      return data.values.filter(function(val, i) { return i === index; })[0];
    });
    context.cursor(index, values);
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