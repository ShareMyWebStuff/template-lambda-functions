'use strict';
const results = require('dotenv').config({ debug: process.env.DEBUG });
const tutor = require ('../../src/handlers/tutor/tutor');
const auth = require('../../src/handlers/authenticate/validate-account');
const login = require('../../src/handlers/authenticate/user-login');
const db = require('../../src/services/db').mysqlDB();

let sqlStatement;
let res;
let validatedUserToken;
let nonValidatedUserToken;
let deletedUserToken;

let event = { };

// 
// The tests we are to run
// 
// 1. Login
//   1.1 parameters undefined. (2ms)
//   1.2 parameters are blank.
//   1.3 Username formatted correctly, password is not. (1ms)
//   1.4 Username not formatted correctly, password is.
//   1.5 Username and password are valid, username does not exist. (1ms)
//   1.6 Username and password are valid, username is not validated. (1ms)
//   1.7 Username and password are valid, account is validated. (62ms)
//   1.8 Invalid http action (GET). (1ms)
//   1.9 Invalid http action (DELETE).
//   1.10 Invalid http action (PUT).

// 
// restInterface - a wrapper to the rest calls
// 
const restInterface = async ( restType, httpMethod, token, body) => {

    if (!restType) return { statusCode: 500, body: { msg: 'restInterface : no restType entered' } };

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['X-Auth-Token'] = token;

    const event = {
        httpMethod,
        headers
    };
    if (body ) event.body = JSON.stringify(body);
    let res;
    switch (restType) {
        case 'Tutor':               res = await tutor.tutorHandler(event);
                                    break;
        case 'Authenticate':        res= await auth.validateEmailAccount(event);
                                    break;
        case 'Login':               res= await login.userLogin(event);
                                    break;
    }

    return {
        statusCode: res.statusCode,
        body: JSON.parse(res.body)
    };

}


// 
// We create the user accounts before running the tests. 
// 
beforeAll( async () => {

    try {
        await db.connectToDB();
        
        await db.saveData( `DELETE FROM smt_user_login WHERE username like 'login%' `);


        let validatedUserToken;
        let nonValidatedUserToken;
        let deletedUserToken;
        

        // Create validated User
        res = await restInterface ( 'Tutor', 'POST', null, { username: 'login_validated_1', email: 'login_1@login.co.uk', password: 'Hello123', password2: 'Hello123', type: '1' } );
        validatedUserToken =  res.body.token;

        res = await restInterface ( 'Authenticate', 'POST', validatedUserToken, {} );

        // Create non validated User
        res = await restInterface ( 'Tutor', 'POST', null, { username: 'login_nonvalidated_2', email: 'login_2@login.co.uk', password: 'Hello123', password2: 'Hello123', type: '1' } );
        nonValidatedUserToken =  res.body.token;

        // Create user and delete so we have a valid token for a 
        res = await restInterface ( 'Tutor', 'POST', null, { username: 'login_deleted_3', email: 'login_3@login.co.uk', password: 'Hello123', password2: 'Hello123', type: '1' } );
        deletedUserToken =  res.body.token;

        res = await restInterface ('Tutor', 'DELETE', deletedUserToken, null );
        
    } catch (error) {
        console.log (error);
    }
});


// 
// Clear up the database after we have run our tests.
// 
afterAll( async () => {

    try {

        await db.disconnectDB();
    } catch (error) {
        console.log (error);
    }
});

// 
// Run the tests
// 
describe ( '1. Login', () => {

    test ('1.1 parameters undefined.', async () => {

        try {
            res = await restInterface ( 'Login', 'POST', null, undefined );
            expect (res.statusCode).toBe(200);
            expect (res.body.error.username).toBe( 'Username has to be 6 - 30 characters and can contain your email address.');
            expect (res.body.error.password).toBe( 'Your password needs to be 6 - 20 characters long and must contain at least one number.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.2 parameters are blank.', async () => {

        try {
            res = await restInterface ( 'Login', 'POST', null, {} );
            expect (res.statusCode).toBe(200);
            expect (res.body.error.username).toBe( 'Username has to be 6 - 30 characters and can contain your email address.');
            expect (res.body.error.password).toBe( 'Your password needs to be 6 - 20 characters long and must contain at least one number.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.3 Username formatted correctly, password is not.', async () => {

        try {
            res = await restInterface ( 'Login', 'POST', null, { username: "UsernameDoesNotExist", password: ""} );
            expect (res.statusCode).toBe(200);
            expect (res.body.error.password).toBe( 'Your password needs to be 6 - 20 characters long and must contain at least one number.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.4 Username not formatted correctly, password is.', async () => {

        try {
            res = await restInterface ( 'Login', 'POST', null, { username: "", password: "Hello123"} );
            expect (res.statusCode).toBe(200);
            expect (res.body.error.username).toBe( 'Username has to be 6 - 30 characters and can contain your email address.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.5 Username and password are valid, username does not exist.', async () => {

        try {
            res = await restInterface ( 'Login', 'POST', null, { username: "usernameDoesNotExist", password: "Hello123"} );
            expect (res.statusCode).toBe(200);
            expect (res.body.error.password).toBe( 'Invalid username and password.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.6 Username and password are valid, username is not validated.', async () => {

        try {
            res = await restInterface ( 'Login', 'POST', null, { username: "login_nonvalidated_2", password: "Hello123"} );
            expect (res.statusCode).toBe(200);
            expect (res.body.error.username).toBe( 'You need to validate your email before login in.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.7 Username and password are valid, account is validated.', async () => {

        try {
            res = await restInterface ( 'Login', 'POST', null, { username: "login_validated_1", password: "Hello123"} );
            expect (res.statusCode).toBe(201);
            expect (res.body.token).toBeDefined( );
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.8 Invalid http action (GET).', async () => {

        try {
            res = await restInterface ( 'Login', 'GET', null, { username: "login_validated_1", password: "Hello123"} );
            expect (res.statusCode).toBe(405);
            expect (res.body.msg).toBe( 'GET was used and not handled.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.9 Invalid http action (DELETE).', async () => {

        try {
            res = await restInterface ( 'Login', 'DELETE', null, { username: "login_validated_1", password: "Hello123"} );
            expect (res.statusCode).toBe(405);
            expect (res.body.msg).toBe( 'DELETE was used and not handled.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.10 Invalid http action (PUT).', async () => {

        try {
            res = await restInterface ( 'Login', 'PUT', null, { username: "login_validated_1", password: "Hello123"} );
            expect (res.statusCode).toBe(405);
            expect (res.body.msg).toBe( 'PUT was used and not handled.');
        } catch (err) {
            console.error (err);
        }

    });
    
});
