import InsituVis from './index.js';
import * as d3 from 'd3';
import {event as d3event} from 'd3';

export default class Indicator extends InsituVis {
  constructor(token) {
    super(token);
    this.state = Object.assign({}, this.state, {
      type: 'change-value-snapshot',
      width: this.state.height,
      padding: 4
    });

    // Create the drawing canvas.
    this.state.svg = d3.select(this.state.domNode)
        .attr('class', 'indicator')
        .style('width', this.state.width + 'px')
        .style('border', 'none')
        .style('padding', '0px')
      .append('svg')
        .attr('width', this.state.width)
        .attr('height', this.state.height);
  }

  formatData(values, type) {
    var match = values.prev === values.current
    if(type === 'short') {
      return match;
    } else if(type === 'long') {

      var string = JSON.stringify(values.prev);
      if(!match) {
        string += '&#8594;';
        string += JSON.stringify(values.current);
      }

      // Add spacing for printed objects.
      var coloredArrow = ' <span style="color: goldenrod"> &#8594; </span> ';
      string = string.replace(/"/g, '');
      string = string.replace(/:/g, ': ');
      string = string.replace(/,/g, ', ')
      string = string.replace(/\{/g, '{ ');
      string = string.replace(/\}/g, ' }');
      string = string.replace('&#8594;', coloredArrow)
      return string;
    }
  }

  render(values) {
    this.values = values;
    var match = this.formatData(values, 'short');
    this.state.svg.selectAll('circle')
        .data([values])
        .style('fill', match ? 'transparent' : this.state.color(0.85))
      .enter().append('circle')
        .attr('cx', this.state.height/2)
        .attr('cy', this.state.height/2)
        .attr('r', this.state.height/2 - this.state.padding)
        .style('fill', match ? 'transparent' : this.state.color(0.85))
        .style('stroke', this.state.color(0.85));
      
    d3.select(this.state.domNode)
      .datum(this)
      .on('mouseover', this.mouseover)
      .on('mouseout', this.mouseout)
      .on('mouseover.shift', this.shift_mouseover)
      .on('mouseout.shift', this.shift_mouseout);
    this.updateSpacing();
  }

  updateSpacing() {
    return; // TODO 
    this.state.width = d3.select(this.state.domNode)[0][0].clientWidth;

    this.state.token.decoration = window.EDITOR.deltaDecorations(this.state.token.decoration, [
      {range: this.state.token.range, options: {inlineClassName: 'manualSize'}}
    ]);

    var token = this.state.token.matches[0];
    var width = this.state.width + 3;
    d3.selectAll('.manualSize')
        .style('padding-right', function() {
          if(this.innerHTML === token) {
            return width + 'px'; 
          } else {
            return d3.select(this).style('padding-right');
          }
        });
  }

  mouseover(context) {
    context.state.svg.style('display', 'none');

    d3.select(this)
        .style('width', 'auto')
      .append('div')
        .html(context.formatData(context.values, 'long'))
        .attr('class', 'value-vis')
        .style('pointer-events', 'none')
        .style('width', 'auto')
        .style('background', context.state.color(0.9));

    context.updateSpacing();
  }

  mouseout(context) {
    context.state.svg.style('display', 'initial');
    d3.select(this).style('width', context.state.height + 'px')
      .selectAll('.value-vis').remove();
    context.updateSpacing();
  }

  shift_mouseover(d) {
    if(d3event.shiftKey) {
      var context = d3.select(this).datum();
      d3.selectAll('.indicator')[0].forEach(function(element) {
        if(element !== context.state.domNode) {
          var event = document.createEvent('SVGEvents');
          event.initEvent('mouseover',true,true);
          element.dispatchEvent(event);
        }
      });
    }
  }

  shift_mouseout(d) {
    d3.selectAll('.indicator').selectAll('svg').style('display', 'initial');
    var context = d3.select(this).datum();
    d3.selectAll('.indicator').style('width', context.state.height + 'px')
      .selectAll('.value-vis').remove();
    d3.selectAll('.indicator')[0].forEach(function(element) {
      d3.select(element).datum().updateSpacing();
    });
  }
}