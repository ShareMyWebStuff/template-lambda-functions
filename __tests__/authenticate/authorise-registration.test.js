'use strict';
const results = require('dotenv').config({ debug: process.env.DEBUG });
const tutor = require('../../src/handlers/tutor/tutor');
const authenticate = require('../../src/handlers/authenticate/validate-account');
const db = require('../../src/services/db').mysqlDB();

let sqlStatement;
let res;
let validateToken;
let deletedUserToken;

let event = { };

// 
// The tests we are to run
// 
// 1. Authenticate Registered Users
//   1.1 No user id to authenticate passed in. (2ms)
//   1.2 User-id passed in that doesnt exist on the database. (1ms)
//   1.3 User-id passed in that does exist and not validated. (4ms)
//   1.4 User-id passed in that does exist and validated. (1ms)
//   1.5 Invalid http action (GET).
//   1.6 Invalid http action (DELETE).
//   1.7 Invalid http action (PUT). (1ms)


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
        case 'Authenticate':        res= await authenticate.validateEmailAccount(event);
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
        
        await db.saveData( `DELETE FROM smt_user_login WHERE username like 'authenticate%' `);

        // Create user login
        res = await restInterface ( 'Tutor', 'POST', null, { username: 'authenticate_1', email: 'auth_1@authenticate.co.uk', password: 'Hello123', password2: 'Hello123', type: '1' } );
        validateToken =  res.body.token;

        // Create user and delete so we have a valid token for a 
        res = await restInterface ( 'Tutor', 'POST', null, { username: 'authenticate_2', email: 'auth_2@authenticate.co.uk', password: 'Hello123', password2: 'Hello123', type: '1' } );
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
describe ( '1. Authenticate Registered Users', () => {

    test ('1.1 No user id to authenticate passed in.', async () => {

        try {
            res = await restInterface ( 'Authenticate', 'POST', null, {} );
            expect (res.statusCode).toBe(200);
            expect (res.body.msg).toBe( 'User is not signed in.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.2 User-id passed in that doesnt exist on the database.', async () => {

        try {
            res = await restInterface ( 'Authenticate', 'POST', deletedUserToken, {} );
            expect (res.statusCode).toBe(200);
            expect (res.body.error.msg).toBe( 'The specified user does not exist.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.3 User-id passed in that does exist and not validated.', async () => {

        try {
            res = await restInterface ( 'Authenticate', 'POST', validateToken, {} );
            expect (res.statusCode).toBe(201);
            expect (res.body.msg).toBe( 'Account validated.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.4 User-id passed in that does exist and validated.', async () => {

        try {
            res = await restInterface ( 'Authenticate', 'POST', validateToken, {} );
            expect (res.statusCode).toBe(200);
            expect (res.body.error.msg).toBe( 'User is already validated.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.5 Invalid http action (GET).', async () => {

        try {
            res = await restInterface ( 'Authenticate', 'GET', null, {} );
            expect (res.statusCode).toBe(405);
            expect (res.body.msg).toBe( 'GET was used and not handled.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.6 Invalid http action (DELETE).', async () => {

        try {
            res = await restInterface ( 'Authenticate', 'DELETE', null, {} );
            expect (res.statusCode).toBe(405);
            expect (res.body.msg).toBe( 'DELETE was used and not handled.');
        } catch (err) {
            console.error (err);
        }

    });
    
    test ('1.7 Invalid http action (PUT).', async () => {

        try {
            res = await restInterface ( 'Authenticate', 'PUT', null, {} );
            expect (res.statusCode).toBe(405);
            expect (res.body.msg).toBe( 'PUT was used and not handled.');
        } catch (err) {
            console.error (err);
        }

    });
    
});
