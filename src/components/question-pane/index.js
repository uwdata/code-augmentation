import {connect} from 'react-redux';
import Renderer from './renderer';
import * as EditorActions from '../../actions/editor';

function mapStateToProps(state, ownProps) {
  return {
    question: state.question,
    example: state.selectedExample
  };
}

const mapDispatchToProps = function(dispatch) {
  return {
    nextQuestion: (next) => {
      dispatch(EditorActions.nextQuestion(next));
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Renderer);
