import React from 'react';
import {MODES} from '../../../constants';
import MonacoEditor from 'react-monaco-editor';
import {hashHistory} from 'react-router';

import './index.css'

const vegaSchema = require('../../../../schema/vega.schema.json');
const vegaLiteSchema = require('../../../../schema/vl.schema.json');

const schemas = {
  [MODES.Vega]: {
    uri: 'https://vega.github.io/schema/vega/v3.0.json',
    schema: vegaSchema,
    fileMatch: ['*']
  }, [MODES.VegaLite]: {
    uri: 'https://vega.github.io/schema/vega-lite/v2.json',
    schema: vegaLiteSchema,
    fileMatch: ['*']
  }
};

function debounce(func, wait, immediate) {
	let timeout;
	return function() {
		const context = this, args = arguments;
		const later = () => {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

export default class Editor extends React.Component {
  static propTypes = {
    value: React.PropTypes.string,
    onChange: React.PropTypes.func
  }

  handleEditorChange(spec) {
    if (this.props.autoParse) {
      if (this.props.mode === MODES.Vega) {
        this.props.updateVegaSpec(spec);
      } else if (this.props.mode === MODES.VegaLite) {
        this.props.updateVegaLiteSpec(spec);
      }
    } else {
      this.props.updateEditorString(spec);
    }
    if (hashHistory.getCurrentLocation().pathname.indexOf('/edited') === -1) {
      hashHistory.push('/edited');
    }
  }

  editorWillMount(monaco) {
    window.MONACO = monaco;
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      schemas: [schemas[this.props.mode]]
    });
  }

  editorDidMount(editor) {
    window.EDITOR = editor;
    // JANE: 'editor' is the monaco editor instance and can be used
    // to 'addContentWidget' or 'changeViewZones'. 'addContentWidget'
    // seems like a good way to add the insitu visualizations to the 
    // editor (you can specify a position) but the text does not wrap
    // around the content widget. 'changeViewZones' seems like an 
    // effective way to do the above and below placement types. 
    // 'deltaDecorations' seems like a good way to add margin placements.
    // For any of the techniques that require reflow, we will still need
    // to figure out how to manually manage the spacing of the text to 
    // make room for it before adding the content widget. It looks like 
    // all the text is placed in 'span', so it should be reaonsable to 
    // find the text we need and add padding to it to make space for the 
    // content widget (just like the ace editor). Using 'deltaDecorations'
    // you can style arbitrary text based on a range. This could be an 
    // easy way to add spacing to relevant tokens in the Vega code

    // Using 'getModel' on 'editor', we can run operations on the text in
    // the editor. 'findMatches' seems like a great way to extract 
    // particular tokens; we can use options to only search in the visible 
    // range, and easily get the range of the token in order to apply the 
    // spacing options mentioned above (using 'deltaDecorations').
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.parse) {
      if (this.props.mode === MODES.Vega) {
        this.props.updateVegaSpec(this.props.value);
      } else if (this.props.mode === MODES.VegaLite) {
        this.props.updateVegaLiteSpec(this.props.value);
      }
      this.props.parseSpec(false);
    }
  }

  manualParseSpec() {
    if (!this.props.autoParse) {
      return (
        <div className="editor-header"> 
          <button id='parse-button' onClick={() => this.props.parseSpec(true)}>Parse</button>
        </div>
      )
    } else {
      return null;
    }
  }
  
  render() {
    return (
      <div className={'full-height-wrapper'}>
        {this.manualParseSpec()}
        <MonacoEditor
          language='json'
          ref='monaco'
          key={JSON.stringify(Object.assign({}, this.state, {mode: this.props.mode, selectedExample: this.props.selectedExample,
            gist: this.props.gist}))}
          options={{
            folding: true,
            scrollBeyondLastLine: false,
            wordWrap: false,
            wrappingIndent: 'same',
            automaticLayout: true,
            autoIndent: true,
            cursorBlinking: 'smooth',
            lineNumbersMinChars: 4,
            glyphMargin: true,
            scrollBeyondLastLine: false,
            readOnly: true,
            showFoldingControls: 'always'
          }}
          defaultValue={this.props.value}
          onChange={debounce(this.handleEditorChange, 500).bind(this)}
          editorWillMount={this.editorWillMount.bind(this)}
          editorDidMount={this.editorDidMount.bind(this)}
        />
      </div>
    );
  }
}
