import InsituVis from './index.js';
import * as d3 from 'd3';

export default class Value extends InsituVis {
  constructor(token) {
    super(token);
    this.state = Object.assign({}, this.state, {
      type: 'data-value-snapshot',
      max_width: 85,
      padding: 2
    });

    // Create the drawing canvas.
    d3.select(this.state.domNode)
        .attr('class', 'value-vis')
        .style('width', 'auto')
        .style('height', this.state.height)
        .style('background', this.state.color(0.9));
  }

  formatData(value, type) {
    var string = '';
    if(typeof value === 'object') {

      if(type === 'short' && Object.keys(value).length > 1) {
        var key = Object.keys(value)[0];
        value = value[key];
        string += '{ ' + key.toString() + ': ' + value.toString() + ', ';
        string += '<span style="color: goldenrod">...</span>';
        string += ' }';
      } else {
        string = JSON.stringify(value);
        string = string.replace(/"/g, '');
        string = string.replace(/:/g, ': ');
        string = string.replace(/,/g, ', ')
        string = string.replace(/\{/g, '{ ');
        string = string.replace(/\}/g, ' }');
      }

    } else {
      string = JSON.stringify(value);
    }
    return string;
  }

  render(value) {
    this.state.value = value;
    d3.select(this.state.domNode)
      .datum(this)
      .style('width', 'auto')
      .html(this.formatData(value, 'short'))
      .on('mouseover', this.mouseover)
      .on('mouseout', this.mouseout);

    // Set the width of the div.
    var width = d3.select(this.state.domNode)[0][0].clientWidth + this.state.padding;
    this.state.width = Math.min(width, this.state.max_width);
    d3.select(this.state.domNode).style('width', this.state.width + 'px');

    this.state.token.decoration = window.EDITOR.deltaDecorations(this.state.token.decoration, [
      {range: this.state.token.range, options: {inlineClassName: 'manualSize'}}
    ]);

    this.updateSpacing();
  }

  updateSpacing() {
    var token = this.state.token.matches[0];
    var padding = this.state.padding;
    var width = this.state.width;
    d3.selectAll('.manualSize')
        .style('padding-right', function() {
          if(this.innerHTML === token) {
            return width + 2*padding + 'px'; 
          } else {
            return d3.select(this).style('padding-right');
          }
        });
  }

  mouseover(context) {
    d3.select(this)
        .html(context.formatData(context.state.value, 'long'))
        .style('opacity', 0.85)
        .style('width', 'auto');

    // Set the width of the div.
    context.state.width = d3.select(this)[0][0].clientWidth + context.state.padding;
    d3.select(this).style('width', context.state.width + 'px');

    context.updateSpacing();
  }

  mouseout(context) {
    d3.select(this)
        .html(context.formatData(context.state.value, 'short'))
        .style('opacity', 1)
        .style('width', 'auto');

    // Set the width of the div.
    var width = d3.select(this)[0][0].clientWidth + context.state.padding;
    context.state.width = Math.min(width, context.state.max_width);
    d3.select(this).style('width', context.state.width + 'px');

    context.updateSpacing();
  }
}