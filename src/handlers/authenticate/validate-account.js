"use strict";
const jwt = require('jsonwebtoken');
const tutor = require ('../../models/modelTutor').tutorModel();
const auth = require ('../../models/modelAuthenticate').authenticateModel();

const validateAccount = () => {

  // 
  // Function : authoriseRegisteredUser
  //
  // This function authorises the specified registered user
  //
  async function validateEmailAccount (event) {
    let res;

    try {
      // Check the user is logged in
      const token = event.headers['X-Auth-Token'];

      if (!token) {
        return { statusCode: 200, message: JSON.stringify( { msg: "User is not signed in."} ) };
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check the user record exists
      let userDets = await tutor.selectTutorById ( { user_id: decoded.user_id });
      if (userDets.rows !== 1) {
        return { statusCode: 200, message: JSON.stringify({error: { msg: "The specified user does not exist."}})};
      }

      if (userDets.user[0].validated === 'Y' ) {
        return { statusCode: 200, message: JSON.stringify({error: { msg: "User is already validated."}}) };
      }

      res = await auth.authenticateRegisteredUser ( { user_id: decoded.user_id });
      if (!res.error && res.changedRows === 1 ){
        return { statusCode: 201, message: JSON.stringify( { msg: "Account validated."} ) };
      }

      return { statusCode: 500, message: JSON.stringify( {error: { msg: "Error updating database."}} ) };
        
    } catch (err) {
      console.log (err);
      return { statusCode: 500, message: JSON.stringify( {error: { msg: "Internal server error 1."}} )};
    }
  }

  return {
    validateEmailAccount
  }

};


// 
// Function : handler
//
// handler the post connection will authorise the users registration
//
exports.validateEmailAccount = async (event) => {

  const response = {
    statusCode: 200,
    headers:{
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, PUT, GET, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With',
    },
    body: JSON.stringify({})
  };

  const va = validateAccount ();

  if (event.httpMethod === 'POST') {
    const {statusCode, message } =  await va.validateEmailAccount(event);
    response.statusCode = statusCode;
    response.body = message;
  } else {
    response.statusCode = 405;
    response.body = JSON.stringify({ msg: `${event.httpMethod} was used and not handled.`});
  }

  return response;
};

