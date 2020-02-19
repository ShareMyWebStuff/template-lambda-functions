const jwt = require('jsonwebtoken');
const bcrypt = require ('bcryptjs');
const tutor = require ('/opt/nodejs/models/modelTutor').tutorModel();
const validator = require ('/opt/nodejs/validation/validationTutor');

const tutorMaintenance = () => {

  // 
  // Function : validateFields
  //
  // This function validates the tutor login details passed in. It returns an object with the validation errors
  //
  function validateFields (event) {
    let body = JSON.parse(event.body);
    let errors = {
      email: null,
      username: null,
      password: null,
      password2: null,
      type: null
    };
    let noErrors = 0;

    if (body === null || body === undefined ) {
      body = {};
    }

    const { email, username, password, password2, type } = body;
    const trimmedUsername = ( username === undefined? '' : username.trim());

    // Validate the inputs
    if (!validator.validateEmail(email)) {
      errors['email'] = "A valid email address needs to be entered.";
      noErrors++;
    }
    if (!validator.validateUsername(trimmedUsername)) {
      errors['username'] = "Username has to be 6 - 30 characters and can contain your email address.";
      noErrors++;
    }
    if (!validator.validatePassword(password)) {
      errors['password'] = "Your password needs to be 6 - 20 characters long and must contain at least one number.";
      noErrors++;
    }
    if ( !errors['password2'] && password !== password2) {
      errors['password2'] = "Your passwords must match.";
      noErrors++;
    }
    if (!validator.validateUserType(type)) {
      errors['type'] = "The user type must be between 1 and 3.";
      noErrors++;
    }

    return { noErrors, errors, email, username: trimmedUsername, password, type };

  }

  // 
  // Function : createTutor
  //
  // This function creates a user or returns the errors as to why the tutor cant be created.
  //
  async function createTutor (event) {

    console.log ('createTutor 1');

    try {
      // Validate user details
      console.log ('createTutor 2');
      const validationStatus = validateFields (event);
      console.log ('createTutor 3');
      if (validationStatus.noErrors > 0){
        return { statusCode: 200, message: JSON.stringify({error: validationStatus.errors}) };
      }
      console.log ('createTutor 4');

      // Check the username isnt already used
      const { username, email, password, type } = validationStatus;
      console.log ('createTutor 5');
      let userDets = await tutor.selectTutorByUsername (username);
      console.log ('createTutor 6');
      if (userDets.rows === 1 && userDets.user[0].validated === 'N') {
        console.log ('createTutor 7');
        if ( userDets.user[0].created_mins < 240 ) {
          console.log ('createTutor 8');

          if ( email !== userDets.user[0].email) {
            console.log ('createTutor 9');
            return { statusCode: 200, message: JSON.stringify({error: {'username': "Username reserved, if this was you re-enter username with original email."}}) };
          }
        }
        console.log ('createTutor 10');
      } else if (userDets.rows === 1) {
        return { statusCode: 200, message: JSON.stringify({error: {'username': "Username already exists"}}) };
      } else if (userDets.rows > 1) {
        return { statusCode: 200, message: JSON.stringify({error: {'msg': "Internal error, number of usernames is greater than 1."}}) };
      }

      console.log ('createTutor 11');
      // Create new user object
      const newUser = { username, email, password, type }; 
      console.log ('createTutor 12');
      const salt = await bcrypt.genSalt(10);
      console.log ('createTutor 13');
      newUser.password = await bcrypt.hash (password, salt);
      console.log ('createTutor 14');

      // Save the user details
      userDets = await tutor.saveTutor (newUser);
      console.log ('createTutor 15');

      if (!userDets.error && ( userDets.affectedRows === 1 || userDets.changedRows === 1 ) ){
        // Return jsonwebtoken
        const payload = {
          user_id:userDets.user_id
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 360000});

        return { statusCode: 201, message: JSON.stringify( { token } ) };
      }

      return { statusCode: '500', message: JSON.stringify( {error: { msg: userDets.errMsg}} ) };

    } catch (e) {
      console.log ('createTutor 99');
      return { statusCode: 500, message: JSON.stringify( {error: { msg: "Internal server error."}} ) };
    }
  }

  // 
  // Function : getTutor
  //
  // This function retrieves the tutor specified by the user_id or returns an error.
  //
  async function getTutor (event) {

    try {
      const token = event.headers['X-Auth-Token'];
      if (!token) {
        return { statusCode: 200, message: JSON.stringify( { msg: "User is not signed in."} ) };
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await tutor.selectTutorById({ user_id: decoded.user_id} );
      if (user.rows !== 1) {
        return { statusCode: 200, message: JSON.stringify( { msg: "Mismatch between token id and database."} ) };
      }

      return { statusCode: 200, message: JSON.stringify( { data: user} ) };

    } catch (err) {
      return { statusCode: 500, message: JSON.stringify( {error: { msg: "Internal server error."}} )};
    }

  }

  // 
  // Function : deleteTutor
  //
  // This function deletes the specified tutor or returns an error
  //
  async function deleteTutor (event) {

    try {
      const token = event.headers['X-Auth-Token'];

      if (!token) {
        return { statusCode: 200, message: JSON.stringify( { msg: "User is not signed in."} ) };
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userDets = await tutor.deleteTutor(decoded.user_id);
      if (userDets.affectedRows !== 1) {
        return { statusCode: 200, message: JSON.stringify( { msg: "The tutor is already deleted."} ) };
      }

      return { statusCode: 201, message: JSON.stringify( { msg: "Account deleted."} ) };
    } catch (err) {
      return { statusCode: 500, message: JSON.stringify( {error: { msg: "Internal server error."}} ) };
    }
  }

  // 
  // Function : updateTutor
  //
  // This function updates the specified tutor unless there is an error.
  //
  async function updateTutor ( event ) {

    try {

      const token = event.headers['X-Auth-Token'];
      if (!token) {
        return { statusCode: 200, message: JSON.stringify( { msg: "User is not signed in."} ) };
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Validate user details
      const validationStatus = validateFields (event);

      // Check the username is unique and hasnt been used
      if (validationStatus.noErrors > 0){
        return { statusCode: 200, message: JSON.stringify({error: validationStatus.errors}) };
      }
      
      const { username, email, password, type } = validationStatus;
      let userDets = await tutor.selectTutorById ( { user_id: decoded.user_id });
      if (userDets.rows !== 1) {
        return { statusCode: 200, message: JSON.stringify({error: { msg: "User in token can not be found."}}) };
      }

      // Create new user object
      const newUser = { username, email, password, type }; 

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash (password, salt);

      // Save the user details
      userDets = await tutor.updateTutor (decoded.user_id, newUser);
      if (!userDets.error && userDets.changedRows === 1 ){
        return { statusCode: 201, message: JSON.stringify( { msg: "Account updated."} ) };
      }
      return { statusCode: 500, message: JSON.stringify( {error: { msg: "Internal server updating database."}} ) };
    } catch (err) {
      return { statusCode: 500, message: JSON.stringify( {error: { msg: "Internal server error."}} ) };
    }
  }

  return {
    createTutor,
    getTutor,
    deleteTutor,
    updateTutor
  }

};


// 
// Function : handler
//
// handler calls the tutor create / update / delete or get depending on the event parameter
//
exports.tutorHandler = async (event) => {

  console.log ('tutorHandler 1');

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
  console.log ('tutorHandler 2');

  const tm = tutorMaintenance ();

  console.log ('tutorHandler 3');

  if (event.httpMethod === 'POST') {
    console.log ('tutorHandler 4');
    const {statusCode, message } = await tm.createTutor(event);
    console.log ('tutorHandler 5');
    response.statusCode = statusCode;
    response.body = message;
  } else if (event.httpMethod === 'GET') {
    console.log ('tutorHandler 6');
    const {statusCode, message } = await tm.getTutor(event);
    console.log ('tutorHandler 7');
    response.statusCode = statusCode;
    response.body = message;
  } else if (event.httpMethod === 'DELETE') {
    console.log ('tutorHandler 8');
    const {statusCode, message } =  await tm.deleteTutor(event);
    console.log ('tutorHandler 9');
    response.statusCode = statusCode;
    response.body = message;
  } else if (event.httpMethod === 'PUT') {
    console.log ('tutorHandler 10');
    const {statusCode, message } =  await tm.updateTutor(event);
    console.log ('tutorHandler 11');
    response.statusCode = statusCode;
    response.body = message;
  } else if (event.httpMethod === 'OPTIONS') {
    console.log ('tutorHandler 12');
    response.statusCode = 201;
    response.body = JSON.stringify({ msg: `${event.httpMethod} sent.`});
    console.log ('tutorHandler 13');
  } else {
    response.statusCode = 405;
    response.body = JSON.stringify({ msg: `${event.httpMethod} was used and not handled.`});
  }

return response;
};

