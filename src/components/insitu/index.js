import './index.css';
import * as d3 from 'd3';
import * as d3color from 'd3-scale-chromatic';

export default class InsituVis {
  constructor(token) {
    this.type = token.type;

    // Extract the property name from the input token
    var property = token.matches[0].replace(/"/g, '');
    property = property.replace('datum.', '');
    property = property.replace(/(\[|\]|\d)/g, '');
    property = property.replace(/\.[a-zA-Z]*/g, '');

    this.state = {
      color: d3color.interpolateRdBu,
      token: token,
      property: property,
      width: 75,
      height: 17,
      steps: 15
    }
    this.state.domNode = this.createDomNode();
    if(token.dataset) this.state.dataset = token.dataset;
  }

  getDomNode() {
    return this.state.domNode;
  }

  setColor(color) {
    this.state.color = color;
  }

  valueToString(value) {
    var string = '';

    if(value instanceof Date) {

      string = value.toDateString() + ', ' + value.toLocaleTimeString();

    } else if(typeof value === 'number') { 
     
      if(Number.isInteger(value)) {
        string = value;
      } else {
        string = value.toFixed(3);
      }
      
    } else if(value instanceof String || typeof value === 'string') {
    
      string = value;
    
    } else if(!value) {
    
      string = 'undefined';
    
    } else {
    
      string = JSON.stringify(value);

      // Update the string values to simplified strings
      var keys = Object.keys(value);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var stringValue = JSON.stringify(value[key]);
        var newString = this.valueToString(value[key]);
        string = string.replace(stringValue, newString);
      }

      // Add some additional whitespace
      string = string.replace(/"/g, '');
      // string = string.replace(/:/g, ': '); // TODO
      string = string.replace(/,/g, ', ')
      string = string.replace(/\{/g, '{ ');
      string = string.replace(/\}/g, ' }');
      string = string.replace(/\[/g, '[ ');
      string = string.replace(/\]/g, ' ]');
    
    }

    var repr = this.state.token.representation;
    if(repr) string = repr + ': ' + string;
    return string;
  }

  update(values) {
    this.render(values);
  }

  createDomNode() {
    var domNode = document.createElement('div');
    d3.select(domNode)
        .datum(this)
        .attr('class', 'insitu')
        .style('width', this.state.width + 'px')
        .style('height', this.state.height + 'px');

    return domNode;
  }

  render() {
    // TODO?
  }

  updateSpacing() {
    // There is nothing to do here.
  }
}
