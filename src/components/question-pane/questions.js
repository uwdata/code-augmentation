export const QUESTIONS = [
  {
    'question': 'Instructions', 
    'subtitle': [
      {
        'text': 'This Vega program creates <>',
        'options': {
          'index': 'an index chart that shows stock information. The lines for each stock are normalized relative to the interactive cursor.',
          'overview': 'an overview+detail visualization. Selecting a region in the smaller visualization zooms the larger region to show that range in more detail. You may also drag the selected region.',
          'population': 'a population chart showing the number of individuals in each age bracket for both women and men. Dragging the slider shows data for different years.',
          'panning': 'a scatterplot of points. You can pan the visible region by dragging the background.'
        }
      },
      {'text': 'Please answer the questions as quickly and completely as possible. Once you have submitted an answer, you will not be able to go back and change it; if at some point you feel that one of your previous answers was wrong, please provide your new answer along with an explanation in the text box for the current question *in addition* to your answer for the current question.'},
      {'text': 'You are free to interact with the Vega visualization and code visualizations as much as you would like for each question, but you cannot change the code itself. You may collapse parts of the code using the buttons in the margin. You can reset the visualization to the initial state by clicking \'Parse\'.'},
      {'text': 'You are welcome to ask any questions about the task or programming environment at this point. However, we cannot answer any questions once the study task has begun.'},
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
    'number': 1,
    'question': 'What is the name of the primary dataset being visualized?'
  },
  {
    'number': 2,
    'question': 'What are the visual encodings of the visualization (e.g. the mapping from data fields to visual properties of the marks)?',
    'subtitle': [
      {'text': 'For each answer, please include the name of the data field, the dataset it came from, and the visual property it encodes (e.g. the \'field name\' field from the \'example\' dataset encodes the point \'size\').'}
    ]
  },
  {
    'number': 3,
    'question': 'What is the primary mark type of the visualization?'
  },
  {
    'number': 4,
    'question': 'For the mark type identified in Question 3, how many marks are created for this visualization?',
    'subtitle': [{'text': 'If you would like to change your previous answer, please write your new answer and an explanation in the text box *in addition* to your answer to the current question.'}],
    'showAnswer': 4
  },
  {
    'number': 5,
    'question': 'Which signals update while interacting with the visualization?',
    'subtitle': [{'text': 'If no signals update, respond \'None\'.'}]
  },
  {
    'number': 6,
    'question': 'Which signals update in response to <> events directly?', 
    'options': {
      'index': 'mousemove',
      'overview': 'drag',
      'population': 'slider',
      'panning': 'drag'
    },
    'subtitle': [{'text': 'Your response may overlap with your previous answer. If no signals update, respond \'None\'.'}]
  },
  {
    'number': 7,
    'question': 'Which signals never update during interaction?'
  },
  {
    'number': 8,
    'question': 'For each signal identified in Question 5, how is it used throughout the code?',
    'subtitle': [{'text': 'If you would like to change your previous answer, please write your new answer and an explanation in the text box *in addition* to your answer to the current question.'}], 
    'showAnswer': 6
  },
  {
    'number': 9,
    'question': 'Which signal is used most frequently to parameterize the data transformations and visual properties of the marks?',
    'subtitle': [{'text': 'If multiple signals are used most frequently, please include all of them.'}]
  },
  {
    'number': 10,
    'question': 'For the signal identified in Question 9, what is the range of values (e.g. min and max value) for that signal?',
    'subtitle': [{'text': 'If you would like to change your previous answer, please write your new answer and an explanation in the text box *in addition* to your answer to the current question.'}],
    'showAnswer': 10
  },
  {
    'number': 11,
    'question': 'Which datasets update while interacting with the visualization?',
    'subtitle': [{'text': 'If no datasets update, respond \'None\'.'}]
  },
  {
    'number': 12,
    'question': 'Which datasets update directly in response to the signals from Question 5?', 
    'subtitle': [
      {'text': 'Your response may overlap with your previous answer. If no datasets update, respond \'None\'.'},
      {'text': 'If you would like to change your previous answer, please write your new answer and an explanation in the text box *in addition* to your answer to the current question.'}
    ],
    'showAnswer': 6
  },
  {
    'number': 13,
    'question': 'Which datasets never update during interaction?'
  },
  {
    'number': 14,
    'question': 'For each dataset identified in Question 11, what data fields are used to parameterize the code?', 
    'subtitle': [
      {'text': 'For each response, please include the dataset name, field name, and how the data field is used in your answer.'},
      {'text': 'If you would like to change your previous answer, please write your new answer and an explanation in the text box *in addition* to your answer to the current question.'}
    ],
    'showAnswer': 12
  },
  {
    'number': 15,
    'question': 'Which data field is used most frequently throughout the code to parameterize the visual properties of the marks?',
    'subtitle': [
      {'text': 'Please also include the dataset from which this field is taken.'},
      {'text': 'If multiple data fields are used most frequently, please include all of them.'}
    ]
  },
  {
    'number': 16,
    'question': 'For the data field identified in Question 15, what is the range of values (e.g. min and max value) for that field?',
    'subtitle': [{'text': 'If you would like to change your previous answer, please write your new answer and an explanation in the text box *in addition* to your answer to the current question.'}],
    'showAnswer': 16
  },
  {
    'number': 17,
    'question': 'Which data field exhibits the largest changes during interaction?',
    'subtitle': [{'text': 'Please also include the dataset from which this field is taken. If no data fields exhibit any changes during interaction, respond \'None\'.'}]
  },
  {
    'number': 18,
    'question': 'Does the visualization exhibit any unexpected behaviors during interaction?', 
    'radio': true, 
    'exitif': 'no'
  },
  {
    'number': 19,
    'question': 'Please describe the unexpected behavior exhibited by the visualization.',
    'measureConfidence': false
  },
  {
    'number': 20,
    'question': 'How did you become aware of this unexpected behavior?',
    'measureConfidence': false
  },
  {
    'number': 21,
    'question': 'Which signals and/or data fields give rise to this unexpected behavior?',
    'subtitle': [{'text': 'Please explain your answer and include the dataset from which the data field is taken.'}]
  },
  {
    'number': 22,
    'question': 'Which signals and/or data fields exhibit or are impacted by this unexpected behavior?',
    'subtitle': [{'text': 'Please explain your answer and include the dataset from which the data field is taken.'}]
  },
  {
    'question': 'You have now completed all the questions for this task!'
  }
];