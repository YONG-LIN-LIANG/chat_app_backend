const db = require('../config/db/mysql');
const checkType = require('../function/index').handleCheckType;
exports.handleGetQuestion = async(req, res, next) => {
  const {question_id, resource_id} = req.query
  const getQuestionSyntax = `SELECT id as question_id, resource_id, question_name, question_content FROM question where id = ${question_id} and resource_id = ${resource_id}`
  const question = await db.execute(getQuestionSyntax).then(res => res[0])
  console.log('test', question)
  
  if(question.length){
    const questionId = question[0].question_id
    let question_content
    if(questionId === 1 || questionId === 2){
      question_content = question[0].question_content.split(',')
    }
    res.status(200).send({
      ...question[0],
      question_content
    })
    return
  }
  res.status(204).send()
}