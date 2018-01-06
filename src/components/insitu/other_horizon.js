import InsituVis from './index.js';
import * as d3 from 'd3';
import * as d3horizon from 'd3-horizon-chart';

// TODO!!! Unfortunately this one isn't working at all...
// I liked the d3.horizon that I used before, but not sure
// how to incorporate with react since it isn't on npm

export default class Horizon extends InsituVis {
  constructor(token) {
    super(token);

    this.state = Object.assign({}, this.state, {
      type: 'data-value-sequence'
    });

    // Create the drawing canvas.
    this.state.svg = d3.select(this.state.domNode).append('svg')
        .attr('class', 'horizon')
        .attr('width', this.state.width)
        .attr('height', this.state.height);

    // Create the original horizon.
    this.state.horizon = d3horizon.horizonChart()
        .height(this.state.height);
  }

  formatData(values) {
    return values.map(function(value, i) { return [i, value]; });
  }

  render(values) {
    var data = this.formatData(values);
    this.state.horizon.colors([
      this.state.color(0.05),
      this.state.color(0.45), 
      this.state.color(0.55),
      this.state.color(0.95)
    ]);
    this.state.svg.selectAll('.horizon')
        .data([data])
      .enter().append('div')
        .attr('class', 'horizon')
        .each(this.state.horizon);
    //this.state.svg.data([data]).call(this.state.horizon);
  }
}