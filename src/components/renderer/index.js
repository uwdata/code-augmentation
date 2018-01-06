import {connect} from 'react-redux';
import Renderer from './renderer';
import * as EditorActions from '../../actions/editor';

function mapStateToProps(state, ownProps) {
  return {
    vegaSpec: state.vegaSpec,
    specName: state.selectedExample,
    renderer: state.renderer,
    mode: state.mode,
    errorPane: state.errorPane,
    warningsLogger: state.warningsLogger,
    error: state.error,
    tooltip: state.tooltip,
    step: state.step,
    history: state.history,
    shouldUpdate: state.shouldUpdate
  };
}

const mapDispatchToProps = function(dispatch) {
  return {
    logError: (err) => {
      dispatch(EditorActions.logError(err));
    },

    recordState: (state) => {
      dispatch(EditorActions.recordState(state));
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Renderer);
