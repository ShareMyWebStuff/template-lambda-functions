const jwt = require('jsonwebtoken');
const bcrypt = require ('bcryptjs');
const validator = require ('../../validation/validationTutor');
const tutor = require ('../../models/modelTutor').tutorModel();

const userLogin = () => {

    // 
    // Function : loginValidation
    //
    // This function validates the login details. It returns an object with the validation errors
    //
    const loginValidation = (event) => {
      
        let body;
  
        if (event.body === undefined || event.body === null ) {
            body = {};
        } else {
            body = JSON.parse(event.body);
        }
  
        const { username, password } = body;
        const trimmedUsername = ( username === undefined? '' : username.trim());
        let errors = {};
        let noErrors = 0;
  
        // Validate the inputs
        if (!validator.validateUsername(trimmedUsername)) {
            errors['username'] = "Username has to be 6 - 30 characters and can contain your email address.";
            noErrors++;
        }
      
        if (!validator.validatePassword(password)) {
            errors['password'] = "Your password needs to be 6 - 20 characters long and must contain at least one number.";
            noErrors++;
        }
      
        return { noErrors, errors, username: trimmedUsername, password };
    }
  
  
    // 
    // Function : login
    //
    // This function handles the user login in with the reuired username and password
    //
    async function login (event) {
        const debugStuff = {};
  
        try {

            console.log ('login 1');

            // Validate user details
            // debugStuff.msg1 = "login1";
            // debugStuff.event = event;
            const validationStatus = loginValidation (event);
            console.log ('login 2');
            console.log (validationStatus);
            // Check the username is unique and hasnt been used
            // debugStuff.msg2 = "login2";
            if (validationStatus.noErrors > 0){
                console.log ('login 3');
                // debugStuff.msg3 = "login3";
                return { statusCode: 200, message: JSON.stringify({error: validationStatus.errors}) };
            }
  
            // debugStuff.msg4 = "login4";
            // debugStuff.validationStatus = validationStatus;
            console.log ('login 4');
            const { username, password } = validationStatus;
  
            // debugStuff.DB_HOST = process.env.DB_HOST;
            // debugStuff.DB_USER = process.env.DB_USER;
            // debugStuff.DB_PASSWORD = process.env.DB_PASSWORD;
            // debugStuff.DB_DATABASE = process.env.DB_DATABASE;
            // debugStuff.DB_PORT     = process.env.DB_PORT;
            // debugStuff.msg5 = "login5";
            // debugStuff.username = username;
            // debugStuff.password = password;
            // debugStuff.msg51 = "login51";
            // debugStuff.tutor = tutor;
            // debugStuff.msg52 = "login52";
            console.log ('login 5');
            let userDets = await tutor.selectTutorByUsername (username);
            console.log ('login 6');
            // debugStuff.msg6 = "login6";
            // debugStuff.userDets = userDets;
            // debugStuff.msg61 = "login6.1";
            if (userDets.rows === 0) {
                // debugStuff.msg7 = "login7";
                return { statusCode: 200, message: JSON.stringify({error: {'password': "Invalid username and password."}}) };
            }
  
            // debugStuff.msg8 = "login8";
            if (userDets.user[0].validated === 'N') {
                // debugStuff.msg9 = "login9";
                return { statusCode: 200, message: JSON.stringify({error: {'username': "You need to validate your email before login in."}}) };
            }
  
            // Check the password matches
            // debugStuff.msg10 = "login10";
            const isMatched = await bcrypt.compare(password, userDets.user[0].password);
            if (!isMatched) {
                // debugStuff.msg11 = "login11";
                return { statusCode: 200, message: JSON.stringify({error: {'password': "Invalid username and password."}}) };
            }
  
            // debugStuff.msg12 = "login12";
            // Return jsonwebtoken
            const payload = {
                user_id:userDets.user[0].user_id
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 360000});
  
            return { statusCode: 201, message: JSON.stringify( { token } ) };
  
        }catch (err) {
            debugStuff.msg = "Internal server error.";

            return { statusCode: 501, message: JSON.stringify( {error: debugStuff} ) };
            // return { statusCode: 500, message: JSON.stringify( {error: { msg: "Internal server error."}} ) };
        }
    }
  
    return {
      login
    }
  
};
  
exports.userLogin = async (event) => {

    console.log (event);

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

    const ul = await userLogin ();
    console.log ("Login in.")
  
    if (event.httpMethod === 'POST') {
        console.log ("Post 1.");
        const {statusCode, message } = await ul.login(event);
        console.log ("Post 2.");
        response.statusCode = statusCode;
        response.body = message;
    }
    else if (event.httpMethod === 'OPTIONS') {
        console.log ("Options.")
        response.statusCode = 201;
        response.body = JSON.stringify({ msg: `${event.httpMethod} sent.`});
    } else {
        console.log ("Else.")
        response.statusCode = 405;
        response.body = JSON.stringify({ msg: `${event.httpMethod} was used and not handled.`});
    }

    console.log ('Response');
    console.log (response);
    return response;
}
