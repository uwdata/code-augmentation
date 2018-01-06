import Heatmap from '../../insitu/heatmap.js';
import Histogram from '../../insitu/histogram.js';
import Horizon from '../../insitu/horizon.js';
import Indicator from '../../insitu/indicator.js';
import Line from '../../insitu/line.js';
import Multiline from '../../insitu/multiline.js';
import Tick from '../../insitu/tick.js';
import Value from '../../insitu/value.js';
import './index.css';
import * as d3color from 'd3-scale-chromatic';

// TODO temporary globals
// var SIGNAL = 'tick';
// var DATA = 'histogram';

function difference(s1, s2, measure) {
  if(s1 === null || s2 === null) return 0;
  if(!measure) measure = 'variance';
  var diff = s1.state[measure] - s2.state[measure];
  if(isNaN(diff) || diff === null) diff = -10000;
  return diff;
}

function min(values) {
  return values.reduce(function(a,b) { return Math.min(a,b); }, values[0]);
}

function max(values) {
  return values.reduce(function(a,b) { return Math.max(a,b); }, values[1]);
}

function median(values) {

}

function mean(values) {
  var sum = values.reduce(function(a,b) { return a+b; }, 0);
  return sum/values.length;
}

export default class Annotator {

  getTaskCondition() {
    if(this.state.name.indexOf('baseline') !== -1) {
      return 'baseline';
    } else {
      return 'visualization';
    }
  }

  constructor(name, spec, current) {
    this.state = {
      initialized: false,
      name: name,
      spec: spec,
      signals: Object.keys(current.signals),
      datasets: Object.keys(current.data),
      properties: [],
      tokens: {},
      widgets: {},
      history: [],
      current: current
    };
  }

  // Extract the data properties and editor tokens
  initialize() {
    if(this.state.initialized || !window.EDITOR) return;
    d3.selectAll('.insitu').remove();
    this.state.properties = this.getDataProperties(this.state.datasets);

    var signals = [].concat(this.state.signals);
    var subsignals = [];
    var subdata = [];
    if(this.state.current.subcontext) {
      this.state.current.subcontext.forEach(function(context, index) {
        Object.keys(context.signals).forEach(function(signal) {
          if(signals.indexOf(signal) === -1) signals.push(signal);
          subsignals.push({'subcontext': index, 'signal': signal});
        });
      });

      this.state.current.subcontext.forEach(function(context, index) {
        Object.keys(context.data).forEach(function(dataset) {
          subdata.push({'subcontext': index, 'dataset': dataset});
        });
      });
    }
    this.state.subcontext_signals = subsignals;
    this.state.subcontext_datasets = subdata;

    this.getTokens(this.state.properties, 'data');
    this.getTokens(signals, 'signal');
    this.state.initialized = true;

    // Set up hover information on the tokens
    var context = this;
    this.state.hover = window.MONACO.languages.registerHoverProvider('json', {
      provideHover: function(model, position) {
        var key = Object.keys(context.state.tokens)
            .filter(function(key) { return Number(key.split('.')[0]) === position.lineNumber; })
            .filter(function(key) {
              var pos = key.split('.');
              return pos[1] <= position.column && position.column <= pos[2];
            })[0];

        if(!key) return null;

        var token = context.state.tokens[key];
        return {
          range: token.range,
          contents: context.getValue(token)
        };
      }
    });
  }

  // The set of rules to determine the signal vis type
  getSignalVisType(match) {

    var signal = match.matches[0];
    signal = signal.replace(/"/g, ''); // Remove " from
    
    // Clean up signal if has an array or object reference
    var reference;
    if(signal.indexOf('[') !== -1) {
      reference = signal.match(/\[\d*\]/g)[0];
      match.arrayref = reference.replace(/(\[|\])/g, '');
      signal = signal.replace(reference, '');
    } else if(signal.indexOf('.') !== -1) {
      reference = signal.match(/\.[a-zA-Z]*/g)[0];
      match.arrayref = reference.replace('.', '');
      signal = signal.replace(reference, '');
    }

    var signalDef;
    var value;
    if(match.source) {
      value = VEGA_DEBUG.view._runtime.subcontext[match.source].signals[signal].value;
      signalDef = this.state.spec.marks[match.source].signals.filter(function(sdef) {
        return sdef.name === signal;
      })[0];
    } else {
      value = VEGA_DEBUG.view.signal(signal);
      signalDef = this.state.spec.signals.filter(function(sdef) {
        return sdef.name === signal;
      })[0];

      var otherDef = [];
      this.state.spec.marks.forEach(function(mark) {
        if(!mark.signals) return;
        otherDef = otherDef.concat(mark.signals.filter(function(sdef) { return sdef.name === signal; }));
      });
      otherDef.forEach(function(def) { if(def.push === 'outer') signalDef = def; });
    }

    if(match.arrayref && value) value = value[match.arrayref];

    // TODO: This is semi-close to working. But, we need to get it setup such that
    // the detail domain definition is the one from the subcontext (the fact that it is
    // pushed is relevant for getting the right type...)
    var type;
    if(!signalDef || (!signalDef.on && !signalDef.bind && !signalDef.update)) {
      type = 'indicator';
    } else if(value && value instanceof Array) {
      type = 'multiline';
    } else if(value && (typeof value === 'number' || value instanceof Date)) {
      type = 'line';
    } else {
      type = 'tick';
    }
    return type;
  }

  // The set of rules to determine the data vis type
  getDataVisType(match) {
    var property = match.matches[0].replace(/"/g, '');
    property = property.replace('datum.','');

    // Clean up property name if has an array or object reference
    if(property.indexOf('.') !== -1) {
      var reference = property.match(/\.[a-zA-Z]*/g)[0];
      match.arrayref = reference.replace('.', ''); 
      property = property.replace(reference, '');
    }
    

    var dataset = match.dataset;
    return 'histogram';
  }

  setCurrentState(current, step) {
    this.state.current = current;
    this.state.step = step;
    this.initialize();
  }

  setHistory(history) {
    this.state.history = history;
  }

  getDataProperties(datasets) {
    var properties = [];
    datasets.forEach(function(dataname) {
      if(dataname === 'root') return;
      var data = window.VEGA_DEBUG.view.data(dataname);
      properties = properties.concat(Object.keys(data[0]));
    });
    return properties;
  }

  getData(dataset, precomputed) {
    var data;
    if(typeof dataset === 'object') {
      data = window.VEGA_DEBUG.view._runtime.subcontext[dataset.subcontext].data[dataset.dataset];
    } else {
      data = window.VEGA_DEBUG.view._runtime.data[dataset];
    }

    if(!data) return null;
    if(precomputed) return data.input.value;
    return data.values.value;
  }

  // Extract matches for each token
  getTokens(tokens, type) {
    for(var i = 0; i < tokens.length; i++) {
      this.extractToken(tokens[i], type);
    }
  }

  // Determine which dataset the input token corresponds to
  identifyDataset(token) {
    var contains = function(array, value) { return array.indexOf(value) !== -1; };

    var found = false;
    var precomputed = false;
    var index = token.range.startLineNumber;
    var dataset = false;

    // TODO: lots of repeated code, try to find a better strategy
    var line = window.EDITOR.getModel().getLineContent(index);
    var search = ['"name":', '"data":'];
    if(contains(line, '"key":')) search = ['"from":'];
    if(contains(line, '"filter"')) search = ['"source":', '"values":'];

    while(!found && index > 0) {
      line = window.EDITOR.getModel().getLineContent(index);
      var check = search.map(function(seek) { return contains(line, seek); });
      var first = check.indexOf(true);
      found = first !== -1;
      index -= 1;

      // When a token is found, determine the dataset.
      if(found) {
        var string = search[first];
        var result = line.match(new RegExp('(' + string + ')[^,]*,', 'g'));
        if(result) {
          dataset = result[0].replace(string,'').replace(/( |,|"|})/g, '');
        } else {
          search = ['"name":'];
          precomputed = true;
          //console.error('  help!', line, result);
          found = false;
        }
      }
    }

    // TODO: if(!found) console.error('uh oh, really help: ', token);
    return {'name': dataset, 'precomputed': precomputed};
  }

  identifySource(token) {
    var signalname = token.matches[0].replace(/"/g, '');
    signalname = signalname.replace(/(\[|\]|\d)/g, '');
    var subcontext = this.state.subcontext_signals.filter(function(s) { return s.signal === signalname; });
    if(subcontext.length === 0) return false; // It is just a top-level signal.

    var source;
    var intoplevel = this.state.signals.indexOf(signalname) !== -1;
    if(intoplevel && subcontext.length > 0) {
      // TODO: this won't actually work, because it doesn't 'close' the context
      // TODO: this code is all around very brittle
      var matches = window.EDITOR.getModel().findMatches(
        '"signals":',  // string
        false,  // searchEditableRange
        false,  // isRegex
        true,   // matchCase
        ' "',   // word Separators
        true    // captureMatches
      ).map(function(match) { return match.range.startLineNumber; });

      var index;
      for (var i = 0; i < matches.length; i++) {
        if(matches[i] < token.range.startLineNumber) index = i;
      }
      return index === 0 ? false : subcontext[index-1].subcontext;
    } else if(subcontext.length === 1) {
      source = subcontext[0].subcontext;
    } else {
      // We have to actually think about it...
      console.error('help multi', subcontext, token)
    }
    return source;
  }

  // Determine what internal property of an object valued token is used most often
  findRepresentation(token, default_representation) {
    if(token.representation) return;
    var model = window.EDITOR.getModel();
    var property = token.matches[0].replace(/"/g, '');
    var regex = new RegExp(property + '\\.[a-zA-Z]+', 'g');
    var results = {};
    var max = {'count': 0, 'value': null};

    // Helper functions
    var replace = function(val) { return val.replace(property + '.', '')};
    var count = function(repr) {
      if(!results[repr]) results[repr] = 0;
      results[repr] += 1;
      if(results[repr] > max.count) {
        max = {'count': results[repr], 'value': repr};
      }
    };

    for (var i = 1; i <= model.getLineCount(); i++) {
      var line = model.getLineContent(i);
      var matches = line.match(regex);
      if(matches) matches.map(replace).forEach(count);
    }
    token.representation = max.value;
    if(!token.representation) token.representation = default_representation;
  }

  // Find all editor matches for the given token
  extractToken(token, type) {
    var model = window.EDITOR.getModel();
    var matches, regex;
    if(type === 'signal') {
      regex = new RegExp('(' + token + '\\.[a-zA-Z]*' + '|' + token + '\\[\\d*\\]' + '|' + '"' + token + '"' + '|' + token + ')', 'g');
      matches = model.findMatches(
        regex,  // regex
        false,  // searchEditableRange
        true,   // isRegex
        true,   // matchCase
        ' "(){},*+-/[]',   // word Separators
        true    // captureMatches
      );
    } else if (type === 'data') {
      regex = new RegExp('(' + token + '\\.[a-zA-Z]*' + '|' + '"' + token + '"|datum.' + token + '\\.?[a-zA-Z]*' + ')', 'g');
      matches = model.findMatches(
        regex,  // regex
        false,  // searchEditableRange
        true,   // isRegex
        true,   // matchCase
        ' "(){},*+-/[]',   // word Separators
        true    // captureMatches
      );
    }
    
    for (var i = 0; i < matches.length; i++) {

      // Make sure that the token is valid.
      var VALID = true;
      var lineNumber = matches[i].range.startLineNumber;
      var line = model.getLineContent(lineNumber);

      // Check if the token is a dataset reference.
      if(type === 'data') {
        var regex_from = new RegExp('("from":)[^,]*"' + token + '"', 'g');
        var regex_name = new RegExp('("name":)[^,]*"' + token + '"', 'g');
        if(line.match(regex_from) || line.match(regex_name)) VALID = false;

        // Check if we can identify what dataset it is from.
        var result = this.identifyDataset(matches[i]);
        var dataset = result.name;
        var precomputed = result.precomputed;
        if(dataset === false) VALID = false; 
        var SUBCONTEXT = false;
        if(this.state.datasets.indexOf(dataset) === -1) {
          var subdatasets = this.state.subcontext_datasets.map(function(sub) { return sub.dataset; });
          if(subdatasets.indexOf(dataset) !== -1) {
            dataset = this.state.subcontext_datasets[subdatasets.indexOf(dataset)];
          } else {
            VALID = false;
          }
        }
      }

      // Check if the token is (probably) a Vega keyword
      var regex_colon = new RegExp('"' + token + '"[^:]*:[^{]*{', 'g');
      var found = line.match(regex_colon);
      if(found) {
        var index = line.indexOf(found[0]) + 1;
        var startColumn = matches[i].range.startColumn;
        // console.warn('ignore line', found, index === startColumn)
        if(index === startColumn) VALID = false;
      }

      // Create a visualization for the token.
      if(VALID) {
        matches[i].type = type;
        if(type === 'data') {
          matches[i].dataset = dataset;
          matches[i].precomputed = precomputed;
          matches[i].vis = this.getDataVisType(matches[i]);
        } else if(type === 'signal') {
          var source = this.identifySource(matches[i]);
          if(source !== false) matches[i].source = source;
          matches[i].vis = this.getSignalVisType(matches[i]);
        }
        this.createContentWidget(matches[i]);
      }
    }
  }

  // Extract the right type of information for the vis
  extractValues(vis) {
    var property = vis.state.property;
    var dataset = vis.state.token.dataset;
    var precomputed = vis.state.token.precomputed || false;
    var subcontext = vis.state.token.source;

    if(vis.state.token.type === 'data') {
      vis.setColor(d3color.interpolateRdBu);
    } else {
      vis.setColor(d3color.interpolatePiYG);
    }

    switch(vis.state.type) {
      case 'data-value-snapshot':     // Exact Value (signal)
        return this.state.current.signals[property];
      case 'data-value-sequence':     // Line / Horizon (data, signal)
        var values = [];
        var min = Math.max(0, this.state.history.length - vis.state.steps);
        var max = this.state.history.length;
        var states = this.state.history.slice(min, max);
        
        if(vis.state.token.type === 'data') {
          values = states.map(function(state) { 
            if(!state.statistics[dataset]) return null;
            return state.statistics[dataset][property]; 
          });
          if(!values[0]) values = []; // TODO! bad dataset<->property map
          values = values.map(function(stats, index) {
            var prev = index === 0 ? null : values[index-1];
            return difference(stats, prev);
          });
        } else {
          values = states.map(function(state) { 
            if(subcontext) return state.subcontext[subcontext].signals[property];
            return state.signals[property]; 
          });

          if(vis.state.token.arrayref) {
            values = values.map(function(val) { 
              return val ? val[vis.state.token.arrayref] : val; 
            })
          } else if(values[0] instanceof Array) {
            values = values.map(function(val) { return val[0]; });
            vis.setColor(d3color.interpolatePuOr);
          }
        }

        if(values[0] instanceof Date) {
          // Do nothing!
        } else if(values[0] instanceof Object) {
          this.findRepresentation(vis.state.token, Object.keys(values[0])[0]);
          var repr = vis.state.token.representation;
          values = values.map(function(obj) { return obj[repr]; });
          vis.setColor(d3color.interpolatePuOr);
        }

        return values;
      case 'data-value-sequence-multi':
        var values = [];
        var min = Math.max(0, this.state.history.length - vis.state.steps);
        var states = this.state.history.slice(min, this.state.history.length);
        
        if(vis.state.token.type === 'data') {
          // TODO?!
        } else {
          values = states.map(function(state) { 
            if(subcontext) return state.subcontext[subcontext].signals[property];
            return state.signals[property]; 
          });
          vis.setColor(d3color.interpolateOranges)
        }

        return values;
      case 'data-set-snapshot':       // Histogram / Heatmap (data)
        var data = this.getData(dataset, precomputed);
        var values = data.map(function(obj) { return obj[property]; });

        if(vis.state.token.arrayref) {
          values = values.map(function(obj) { return obj[vis.state.token.arrayref]; });
        }

        if(values[0] instanceof Object) {
          this.findRepresentation(vis.state.token);
          var repr = vis.state.token.representation;
          values = values.map(function(obj) { return obj[repr]; });
          vis.setColor(d3color.interpolatePuOr);
        }
        return values;
      case 'change-value-snapshot':   // Indicator (signal)
        var current, prev;
        if(subcontext) {
          current = this.state.history[this.state.step].subcontext[subcontext].signals[property];
          prev = this.state.history[this.state.step - 1].subcontext[subcontext].signals[property];
        } else {

          if(this.state.step === 0) {
            current = this.state.current.signals[property];
            prev = null;
          } else {
            current = this.state.history[this.state.step].signals[property];
            prev = this.state.history[this.state.step - 1].signals[property];
          }
          
        }
        return {prev: prev, current: current};
      case 'change-value-sequence':   // Timeline / Tick (signal)
        var min = Math.max(0, this.state.history.length - vis.state.steps - 1);
        var states = this.state.history.slice(min, this.state.history.length);
        var values;
        if(subcontext) {
          values = states.map(function(state) { return state.subcontext[subcontext].signals[property]; });
        } else {
          values = states.map(function(state) { return state.signals[property]; });
        }

        if(vis.state.token.arrayref) {
          values = values.map(function(val) { 
            return val ? val[vis.state.token.arrayref] : val;
          })
        }

        return values;
      case 'change-set-snapshot':     // Modification indicator (data)
        return []; // TODO!!
      case 'change-set-sequence':     // Stacked Area (data)
        return []; // TODO!!
      default:
        console.error('Unknown type \'' + vis.state.type + '\'');
    }

    return []; // TODO!!!!
  }

  update(history) {
    for (const vis of Object.values(this.state.tokens)) {
      vis.update(this.extractValues(vis));
    }
  }

  updateSpacing() {
    return; //TODO
    // for (const vis of Object.values(this.state.tokens)) {
    //   vis.updateSpacing();
    // }
  }

  // Create a new visualization instance for the token
  createVisualization(token) {
    switch(token.vis) {
      case 'heatmap':
        return new Heatmap(token);
      case 'histogram':
        return new Histogram(token);
      case 'horizon':
        return new Horizon(token);
      case 'indicator': 
        return new Indicator(token);
      case 'line':
        return new Line(token);
      case 'multiline':
        return new Multiline(token);
      case 'tick':
        return new Tick(token);
      case 'value':
        return new Value(token);
      default:
        console.warn('Unknown visualization type \'' + token.vis + '\'');
        return new Value(token);
    }
  }

  getOffset(token) {
    var lineTokens = Object.keys(this.state.tokens).filter(function(id) {
      var split = id.split('.');
      return Number(split[0]) === token.range.startLineNumber;
    });
    var result = lineTokens.map(function(id) { 
      var split = id.split('.');
      return Number(split[1]);
    }).sort();

    var tokenIndex = result.indexOf(token.range.startColumn);
    var offset = tokenIndex;
    if(offset > 0) {
      for (var i = 0; i < tokenIndex; i++) {
        var other = this.state.tokens[lineTokens[i]];
        offset += other.state.width === 17 ? 2 : 10;
      }
    }
    return offset;
  }

  // Create the monaco content widget
  createContentWidget_NO_OFFSET(token) {
    var visualization = this.createVisualization(token);
    var id = token.range.startLineNumber + '.' + token.range.startColumn + '.' + token.range.endColumn;
    if(this.state.tokens[id]) return;
    
    this.state.tokens[id] = visualization;
    // TODO: var width = 11;
    // TODO: var offset = this.getOffset(token);

    var contentWidget = {
      domNode: visualization.getDomNode(),
      getId: function() {
        return token.range.startLineNumber + '.' + token.range.startColumn + '.' + token.range.endColumn;
      },
      getDomNode: function() { return this.domNode; },
      getPosition: function() {
        return {
          position: {
            lineNumber: token.range.startLineNumber,
            column: token.range.endColumn
          },
          preference: [window.MONACO.editor.ContentWidgetPositionPreference.EXACT]
        };
      }
    };
    window.EDITOR.addContentWidget(contentWidget);
    // TODO: this doesn't work because the editor doesn't account for the space...
    var decoration = window.EDITOR.deltaDecorations([], [
      {range: token.range, options: {inlineClassName: 'spacing'}}
    ]);
    visualization.state.token.decoration = decoration;
  }

  createContentWidget_WITH_SPACING(token) {
    var visualization = this.createVisualization(token);
    var id = token.range.startLineNumber + '.' + token.range.startColumn + '.' + token.range.endColumn;
    if(this.state.tokens[id]) return;
    
    this.state.tokens[id] = visualization;
    var offset = this.getOffset(token);

    var contentWidget = {
      domNode: visualization.getDomNode(),
      getId: function() {
        return token.range.startLineNumber + '.' + token.range.startColumn + '.' + token.range.endColumn;
      },
      getDomNode: function() { return this.domNode; },
      getPosition: function() {
        return {
          position: {
            lineNumber: token.range.startLineNumber,
            column: token.range.endColumn + offset
            // Note: Monaco won't position widgets past the last line column 
            // position, so adding spaces at the end might be 'necessary'
          },
          preference: [window.MONACO.editor.ContentWidgetPositionPreference.EXACT]
        };
      }
    };
    window.EDITOR.addContentWidget(contentWidget);
    var decoration = window.EDITOR.deltaDecorations([], [
      {range: token.range, options: {inlineClassName: 'spacing'}}
    ]);
    visualization.state.token.decoration = decoration;
  }

  createContentWidget(token) {
    var visualization = this.createVisualization(token);
    var id = token.range.startLineNumber + '.' + token.range.startColumn + '.' + token.range.endColumn; 
    if(this.state.tokens[id]) return;
    
    this.state.tokens[id] = visualization;

    if(this.getTaskCondition() === 'baseline') return;

    var contentWidget = {
      domNode: visualization.getDomNode(),
      getId: function() {
        return token.range.startLineNumber + '.' + token.range.startColumn + '.' + token.range.endColumn; 
      },
      getDomNode: function() { return this.domNode; },
      getPosition: function() {
        return {
          position: {
            lineNumber: token.range.startLineNumber,
            column: token.range.endColumn
          },
          preference: [window.MONACO.editor.ContentWidgetPositionPreference.EXACT]
        };
      }
    };
    window.EDITOR.addContentWidget(contentWidget);
  }

  getValue(token) {
    
    // Get the data source
    var subcontext = token.state.token.source || (token.state.dataset && token.state.dataset.subcontext);
    var source;
    var state = window.VEGA_DEBUG.view._runtime;
    if(subcontext) {
      source = state.subcontext[subcontext]
    } else {
      source = state;
    }

    // Get the tooltip string
    var strings = [];
    if(token.type === 'data') {
      var name = token.state.dataset.dataset ? token.state.dataset.dataset : token.state.dataset;
      var data = source.data[name].values.value.map(function(val) { return val[token.state.property]; });
      if(token.state.token.arrayref) data = data.map(function(val) { return val[token.state.token.arrayref]; });

      if(typeof data[0] === 'number') {
        strings.push('min: ' + JSON.stringify(min(data)));
        strings.push('max: ' + JSON.stringify(max(data)));
        strings.push('mean: ' + JSON.stringify(mean(data)));
      } else {
        strings.push('data type: ' + typeof data[0]);
      }

    } else if(token.type === 'signal') {
      var value = source.signals[token.state.property].value;
      if(token.state.token.arrayref) value = value[token.state.token.arrayref];

      strings.push('value: ' + JSON.stringify(value));
    }
    return strings;
  }

}
