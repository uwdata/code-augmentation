import React from 'react';
import PropTypes from 'prop-types';
import * as vega from 'vega';
import 'vega-tooltip/build/vega-tooltip.css';
import './index.css';
import {MODES} from '../../constants'
import * as vegaTooltip from 'vega-tooltip';
import Error from '../error';
import ErrorPane from '../error-pane';
import QuestionPane from '../question-pane';
import Toolbar from '../toolbar';
import SplitPane from 'react-split-pane';
import Annotator from '../input-panel/annotator';
import Stats from '../insitu/stats.js';

var EVALUATION = true;

export default class Editor extends React.Component {
  static propTypes = {
    vegaSpec: PropTypes.object,
    renderer: PropTypes.string,
    mode: PropTypes.string
  }

  constructor() {
    super();
    this.state = {
      annotator: null,
    }
  }

  // TODO: this seems like a TON of work to run at each step
  // and is having a definite negative impact on runtime...
  computeStats() {
    var statistics = {};

    // Compute stats for each top-level dataset
    var data = window.VEGA_DEBUG.view._runtime.data;
    Object.keys(data).forEach(function(dataname) {
      if(dataname === 'root') return;
      statistics[dataname] = {};
      var values = data[dataname].values.value;
      if(!values || values.length === 0) {
        statistics[dataname] = null;
        return;
      }
      Object.keys(values[0]).forEach(function(property) {
        var val = values.map(function(obj) { return obj[property]; });
        statistics[dataname][property] = new Stats(val);
      });
    });

    // Compute stats for the first subcontext // TODO!
    if(!window.VEGA_DEBUG.view._runtime.subcontext) return statistics;
    var subcontext = window.VEGA_DEBUG.view._runtime.subcontext[0].data;
    Object.keys(subcontext).forEach(function(dataname) {
      statistics[dataname] = {};
      var values = subcontext[dataname].values.value;
      Object.keys(values[0]).forEach(function(property) {
        var val = values.map(function(obj) { return obj[property]; });
        statistics[dataname][property] = new Stats(val);
      });
    });

    return statistics;
  }

  renderVega(props) {
    this.refs.chart.style.width = this.refs.chart.getBoundingClientRect().width + 'px';
    let runtime;
    let view;
    try {
      runtime = vega.parse(props.vegaSpec);
      view = new vega.View(runtime)
      .logLevel(vega.Warn)
      .initialize(this.refs.chart)
      .renderer(props.renderer)

      if (props.mode === MODES.Vega) {
        view.hover()
      }
      view.run();
    } catch (err) {
      this.props.logError(err.toString());
      throw err;
    }
    this.refs.chart.style.width = 'auto';
    if (this.props.tooltip) {
      vegaTooltip.vega(view);
    }
    window.VEGA_DEBUG.view = view;

    var all = function(){ return true; };
    var data = view.getState({data: all, signals: all});

    if(this.state.annotator) {
      if(this.state.annotator.state.hover) this.state.annotator.state.hover.dispose();
      delete this.state.annotator;
    }
    this.setState({annotator: new Annotator(props.specName, props.vegaSpec, data)});

    // JANE TODO: actually fix the package managing to load dataflow 2.0.6
    const record = this.props.recordState;
    const stats = this.computeStats;
    view._onrun = function(view, count, error) { 
      // TODO: I don't think React can handle recording the state this way
      //       but do we need to be able to have them all? We just
      //       need the variability which we compute between states.
      //var func = function(d,o) { return true; };
      //record(view.getState({data: func, signals: func}));
      var state = view.getState({signals: all});
      state.statistics = stats(); // Compute stats on all the datasets
      record(state); // TODO: There is a huge performance hit from recording the state on run.
    };
  }

  componentDidMount() {
    this.renderVega(this.props);
  }

  // JANE
  componentWillReceiveProps(nextProps) {
    //if(this.props.step !== nextProps.step) {
    if(!nextProps.shouldUpdate) {
      if(this.state.annotator) {
        var all = function(){ return true; };
        var current = window.VEGA_DEBUG.view.getState({data: all, signals: all});
        this.state.annotator.setCurrentState(current, nextProps.step);
        this.state.annotator.setHistory(nextProps.history);
        this.state.annotator.update();
        if(window.EDITOR) window.EDITOR.onDidScrollChange(this.state.annotator.updateSpacing.bind(this.state.annotator));
      }
    } else {
      this.renderVega(nextProps);
    }
  }

  renderChart() {
    return (
      <div className='chart-container'>
        <Error />
        <div className='chart'>
          <div ref='chart'>
          </div>
          {this.props.tooltip ? <div id='vis-tooltip' className='vg-tooltip'></div> : null}
        </div>
        <Toolbar />
      </div>
    );
  }

  render() {
    if (this.props.errorPane) {
      return ( 
        <SplitPane split='horizontal' defaultSize={window.innerHeight * 0.6}
          paneStyle={{display: 'flex'}}>
          {this.renderChart()}
          <ErrorPane />
        </SplitPane>
      );
    } else if(EVALUATION) { // TODO!! For asking questions
      return ( 
        <SplitPane split='horizontal' defaultSize={window.innerHeight * 0.6}
          paneStyle={{display: 'flex'}}>
          {this.renderChart()}
          <QuestionPane />
        </SplitPane>
      );
    } else {
      return (
        this.renderChart()
      );
    }
  }
}
