export const TRAINING = [
  {
    'question': 'Instructions', 
    'subtitle': [
      {'text': 'This Vega program creates a basic bar chart. Mousing over the bars shows a tooltip with the bar value.'},
      {'text': 'For this task you will be asked a series of questions about the behavior of the code. Please answer the questions as quickly and completely as possible. Once you have submitted an answer, you will not be able to go back and change it; if at some point you feel that one of your previous answers was wrong, please provide your new answer along with an explanation in the text box for the current question *in addition* to your answer for the current question.'},
      {'text': 'You are free to interact with the Vega visualization and code visualizations as much as you would like for each question, but you cannot change the code itself. You may collapse parts of the code using the buttons in the margin. You can reset the visualization to the initial state by clicking \'Parse\'.'},
      {'text': 'You are welcome to ask any questions about the task or programming environment at this point. You may continue to ask questions during the training questions. However, I cannot answer any questions once the study task has begun.'},
      {'text': 'Press \'Start\' when you are ready to begin this task.'}
    ]
  },
  {
    'question': 'Exploration Phase',
    'subtitle': [
      {'text': 'Please take this opportunity to thoroughly explore all possible states or settings of the visualization.'},
      {'text': 'When you feel you have sufficiently explored the visualization and are ready to continue to the next step, click \'Next\'.'}
    ]
  },
  {
    'question': 'What is the name of the primary dataset being visualized?',
    'answer': 'table'
  },
  {
    'question': 'What are the visual encodings of the visualization (e.g. the mapping from data fields to visual properties of the marks)?',
    'subtitle': [{'text': 'For each answer, please include the name of the data field, the dataset it came from, and the visual property it encodes (e.g. the \'field name\' field from the \'example\' dataset encodes the point \'size\').'}],
    'answer': 'the \'category\' field from the \'table\' dataset encodes the \'x\' value. the \'amount\' field from the \'table\' dataset encodes the \'y\' value.'
  },
  {
    'question': 'What is the primary mark type of the visualization?',
    'answer': 'rect'
  },
  {
    'question': 'Which signals update while interacting with the visualization?',
    'subtitle': [{'text': 'If no signals update, respond \'None\'.'}],
    'answer': 'tooltip, tooltip_text'
  },
  {
    'question': 'Which signals update in response to mouseover events directly?',
    'subtitle': [{'text': 'Your response may overlap with your previous answer.'}],
    'answer': 'tooltip'
  },
  {
    'question': 'Which datasets update while interacting with the visualization?',
    'subtitle': [{'text': 'If no datasets update, respond \'None\'.'}],
    'answer': 'None'
  },
  {
    'question': 'Which datasets never update during interaction?',
    'answer': 'table'
  },
  {
    'question': 'You have now completed all the training questions!', 
    'subtitle': [
      {'text': 'You are welcome to ask any questions about the tasks or programming environment at this point. However, we cannot answer any questions once you have started the study tasks.'},
    ]
  }
];