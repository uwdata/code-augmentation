import * as d3 from 'd3';

export default class Stats {
  constructor(values) {
    values = this.distribution(values).map(function(val) { 
      return val.length; 
    });
    this.state = {
      values: values,
      //sum: this.sum(values),
      //mean: this.mean(values),
      //range: this.range(values),
      variance: this.varianceOfMean(values),
      //stddev: this.standardDeviation(values)
    }
  }

  setMeasure(measure) {
    this.state.measure = measure;
  }

  distribution(values) {
    if(typeof values[0] === 'number') {
      values = d3.layout.histogram().bins(20)(values);
    } else {
      var x = d3.scale.ordinal().domain(values);
      var index = -1;
      var ordinalRange = x.domain().map(function(x) { return ++index*20; });
      x.range(ordinalRange);
      values = d3.layout.histogram().bins(x.domain().length)(values.map(x));
    }
    return values;
  }

  sum(values) {
    return values.reduce(function(acc, val) { return acc + val; }, 0);
  }

  mean(values) {
    return this.sum(values) / values.length;
  }

  range(values) {
    // TODO: this doesn't seem to be working...
    return Math.max(values) - Math.min(values);
  }

  varianceOfMean(values) {
    var mean = this.mean(values);
    var variance = values.reduce(function(acc, val) {
      return (val - mean)**2 + acc;
    }, 0) / values.length;
    return variance;
  }

  standardDeviation(values) {
    return Math.sqrt(this.varianceOfMean(values));
  }

}