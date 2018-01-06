import React from 'react';
import {QUESTIONS} from '../question-pane/questions.js';
import {TRAINING} from '../question-pane/training.js';

import './index.css';

var ANSWER = [];
var isTraining = false;

export default class QuestionPane extends React.Component {

  getTaskKey() {
    if(!this.props.example || this.props.example === 'bar-chart-visualization') return 'not evaluation';
    var task = this.props.example.replace('-baseline', '').replace('-visualization', '');

    switch(task) {
      case 'bar-chart':
        isTraining = true;
        return 'training';
      case 'stock-index-chart':
        isTraining = false;
        return 'index';
      case 'overview-plus-detail':
        isTraining = false;
        return 'overview';
      case 'scatter-plot':
        isTraining = false;
        return 'panning';
      case 'population-pyramid':
        isTraining = false;
        return 'population';
      default: 
        return 'not evaluation';
    }
  }

  save(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  recordAnswers() {
    var time = new Date();
    var answer = {'end-time': time, 'answer': 'END', 'question': QUESTIONS[this.props.question].question};
    ANSWER.push(answer);

    var filename = this.getTaskKey() + '-' + ANSWER[0]['end-time'].getTime() + '.json';
    this.save(filename, JSON.stringify(ANSWER));
  }

  submit() {
    const step = QUESTIONS[this.props.question];

    var time = new Date();
    var value = 'START';
    var userAnswer = document.getElementById('answer');
    var next = this.props.question+1;

    var confidenceRating = document.getElementsByName('confidence');
    var confidence;
    for(var i = 0; i < confidenceRating.length; i++){
      if(confidenceRating[i].checked) {
        confidence = confidenceRating[i].value;
        confidenceRating[i].checked = false;
      }
    }

    var gaveAnswer = false;
    // console.log(gaveAnswer, userAnswer, confidenceRating)
    if(userAnswer && confidenceRating.length > 0) {
      if(userAnswer.value !== '' && confidence >= 1) {
        gaveAnswer = true;
      }
    } else if(userAnswer && confidenceRating.length === 0) {
      if(userAnswer.value !== '') {
        gaveAnswer = true;
      }
    } else if(!userAnswer && confidenceRating.length === 0) {
      gaveAnswer = true;
    }

    // Update the information if this is the radio question.
    if(step.radio) {
      var yes = document.getElementById('yes').checked;
      var no = document.getElementById('no').checked;
      
      gaveAnswer = (yes || no) && confidence >= 1;
      value = yes ? 'yes' : 'no';
      
      var exit = step.exitif === 'yes' ? yes : no;
      if(exit) next = QUESTIONS.length - 1;
    }

    // Save the user's answer and continue
    console.log('step', step, ANSWER)
    console.log('state', this)
    if(gaveAnswer) {
      value = userAnswer ? userAnswer.value : value;
      if(userAnswer) userAnswer.value = '';

      var answer = {'end-time': time, 'question': QUESTIONS[this.props.question].question, 'answer': value, 'confidence': Number(confidence)};
      ANSWER.push(answer);
      this.props.nextQuestion(next);
    } else {
      //alert('You must provide an answer to continue.');
    }
  }

  answer() {
    const step = TRAINING[this.props.question];

    var time = new Date();
    var value = 'START';
    var answerDiv = document.getElementById('training-answer');
    var answerButton = document.getElementById('answer-button');
    var userAnswer = document.getElementById('answer');

    var gaveAnswer = userAnswer ? userAnswer.value !== '' : false;
    
    if(gaveAnswer && answerDiv.style.display === 'none') {
      answerDiv.style.display = 'inherit';
      answerButton.innerHTML = 'Next';
    } else if(gaveAnswer) {
      answerDiv.style.display = 'none';
      answerButton.innerHTML = 'Show Answer';
      value = userAnswer.value;
      userAnswer.value = '';

      var answer = {'end-time': time, 'answer': value, 'question': step.question};
      ANSWER.push(answer);
      this.props.nextQuestion(this.props.question+1);
    } else if(!userAnswer) {
      this.props.nextQuestion(this.props.question+1);
    }
  }

  training() {

    // Disable interacting until you start the task...
    var chart = document.getElementsByClassName('chart')[0];
    var code = document.getElementsByClassName('full-height-wrapper')[0];

    const step = TRAINING[this.props.question];
    const question = step.question;
    const subtitle = [];
    const answer = step.answer;
    const last = TRAINING.length - 1;

    const divStyle = {display: 'none'}

    if(step.subtitle) {
      step.subtitle.forEach(function(paragraph, i) {
        var text = paragraph.text;
        subtitle.push(<p key={'p' + i}>{text}</p>);
      });
    }

    if(this.props.question === 0) {

      if(chart !== undefined) {
        chart.style['pointer-events'] = 'none';
        var node = document.createElement('div');
        node.className = 'disable_message';
        node.innerHTML = 'Please start the task before interacting with the Vega visualization or code. Review the instructions and press \'Start\' when you are ready to begin.';
        chart.appendChild(node);
      } 
      if(code !== undefined) code.style['pointer-events'] = 'none';

      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <button onClick={(e) => this.answer()}>Start</button>
        </div>
      );
    } else if(this.props.question === 1) {
      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <button onClick={(e) => this.answer()}>Next</button>
        </div>
      );
    } else if(this.props.question === last) {
      this.recordAnswers();
      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <br/>
          <button onClick={(e) => this.recordAnswers()}>Save</button>
        </div>
      );
    } else if(step.showAnswer) {
      const prevAnswer = ANSWER[step.showAnswer-1].answer;
      const prevQuestion = TRAINING[step.showAnswer].question;

      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <div className='answer'>
            <h4>Question {step.showAnswer}:</h4>
            <p>{prevQuestion}</p>
            <h4>Your answer:</h4>
            <p>{prevAnswer}</p>
          </div>
          <textarea id='answer' />
          <div id='training-answer' className='answer' style={divStyle}>
            <h4>Sample answer:</h4>
            <p>{answer}</p>
          </div>
          <button id='answer-button' onClick={(e) => this.answer()}>Show Answer</button>
        </div>
      );

    } else {
      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <textarea id='answer' />
          <div id='training-answer' className='answer' style={divStyle}>
            <h4>Sample answer:</h4>
            <p>{answer}</p>
          </div>
          <button id='answer-button' onClick={(e) => this.answer()}>Show Answer</button>
        </div>
      );
    }
  }

  render() {

    // Disable interacting until you start the task...
    var chart = document.getElementsByClassName('chart')[0];
    var code = document.getElementsByClassName('full-height-wrapper')[0];
    var disable = document.getElementsByClassName('disable_message')[0]
    if(chart !== undefined && code !== undefined) {
      chart.style['pointer-events'] = 'initial';
      code.style['pointer-events'] = 'initial';
      if(disable !== undefined) disable.remove();
    }

    // Render the questions pane
    const task = this.getTaskKey();
    if(task === 'not evaluation') return <div/>;

    const last = QUESTIONS.length - 1;
    const step = QUESTIONS[this.props.question];
    var question = step.question;
    const subtitle = [];
    var confidence = <br/>;

    if(step.options) {
      question = question.replace('<>', step.options[task]);
    }

    if(step.measureConfidence !== false) {
      const formStyle = {display:'inline-block', padding:'0px 3px'};
      confidence = (
        <div>
          <h4>How confident are you in your answer?</h4>
          <form id='confidence'>
          <div style={formStyle}>Not Confident<br/>&nbsp;</div>
          <div style={formStyle}><input type='radio' name='confidence' value='1'/><br/>&nbsp;1</div>
          <div style={formStyle}><input type='radio' name='confidence' value='2'/><br/>&nbsp;2</div>
          <div style={formStyle}><input type='radio' name='confidence' value='3'/><br/>&nbsp;3</div>
          <div style={formStyle}><input type='radio' name='confidence' value='4'/><br/>&nbsp;4</div>
          <div style={formStyle}><input type='radio' name='confidence' value='5'/><br/>&nbsp;5</div>
          <div style={formStyle}>Extremely Confident<br/>&nbsp;</div>
          </form>
          <br/>
        </div>
        
      );
    }

    if(step.subtitle) {
      step.subtitle.forEach(function(paragraph, i) {
        var text = paragraph.text;
        if(paragraph.options) {
          text = paragraph.text.replace('<>', paragraph.options[task]);
        }
        subtitle.push(<p key={'p' + i}>{text}</p>);
      });
    }

    if(isTraining) {

      return this.training();

    } else if(this.props.question === 0) {

      if(chart !== undefined) {
        chart.style['pointer-events'] = 'none';
        var node = document.createElement('div');
        node.className = 'disable_message';
        node.innerHTML = 'Please start the task before interacting with the Vega visualization or code. Review the instructions and press \'Start\' when you are ready to begin.';
        chart.appendChild(node);
      }
      if(code !== undefined) code.style['pointer-events'] = 'none';

      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <button onClick={(e) => this.submit()}>Start</button>
        </div>
      );

    } else if(this.props.question === 1) {

      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <button onClick={(e) => this.submit()}>Next</button>
        </div>
      );

    } else if(this.props.question === last) {

      this.recordAnswers();
      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <br/>
          <button onClick={(e) => this.recordAnswers()}>Save</button>
        </div>
      );

    } else if(step.radio) {

      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <form>
            <input type='radio' name='radio' value='yes' id='yes'/> Yes<br/>
            <input type='radio' name='radio' value='no' id='no'/> No<br/>
          </form>
          {confidence}
          <button onClick={(e) => this.submit()}>Submit</button>
        </div>
      );

    } else if(step.showAnswer) {

      const answer = ANSWER[step.showAnswer].answer;
      const prevQuestion = QUESTIONS[step.showAnswer].question;

      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <div className='answer'>
            <h4>Question {step.showAnswer-1}:</h4>
            <p>{prevQuestion}</p>
            <h4>Your answer:</h4>
            <p>{answer}</p>
          </div>
          <textarea id='answer' />
          {confidence}
          <button onClick={(e) => this.submit()}>Submit</button>
        </div>
      );

    } else {

      return (
        <div className='question-pane'>
          <h3>{question}</h3>
          <ul>{subtitle}</ul>
          <textarea id='answer' />
          {confidence}
          <button onClick={(e) => this.submit()}>Submit</button>
        </div>
      );

    }
  }
}
