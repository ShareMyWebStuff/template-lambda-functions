'use strict';
const results = require('dotenv').config({ debug: process.env.DEBUG });
const tutor = require('../../src/handlers/tutor/tutor');
const db = require('../../src/services/db').mysqlDB();

let sqlStatement;
let res;
let readToken;
let deleteToken;
let updateToken;
let createDeleteToken;

let event = { };

// 
// The tests we are to run
// 
// 1. Test Create Tutor
//   1.1 Username validation Checks
//     1.1.1 No username entered (4ms)
//     1.1.2 Username too short
//     1.1.3 Username too long (1ms)
//     1.1.4 Username can contain uppercase characters
//     1.1.5 Username can contain lowercase characters (1ms)
//     1.1.6 Username can contain numbers
//     1.1.7 Username can contain email characters (first set) (1ms)
//     1.1.8 Username can contain email characters (second set)
//   1.2 Email validation checks
//     1.2.1 No email entered (1ms)
//     1.2.2 A blank email
//     1.2.3 An invalid email (dad) (1ms)
//     1.2.4 An invalid email (dad@) (1ms)
//     1.2.5 An invalid email (dad@dad)
//     1.2.6 A valid email (2ms)
//   1.3 Password(s) validation checks
//     1.3.1 No Passwords entered (1ms)
//     1.3.2 Blank password entered
//     1.3.3 Password less than 6 characters (1ms)
//     1.3.4 Password greater than 20 characters (1ms)
//     1.3.5 Valid password, missing confirmation password
//     1.3.6 Valid password, blank confirmation password (1ms)
//     1.3.7 Valid passwords (1ms)
//   1.4 Tutor Type validation checks
//     1.4.1 No tutor type entered
//     1.4.2 Blank tutor type entered
//     1.4.3 Alphanumeric tutor type entered
//     1.4.4 Numeric tutor type entered that is out of range (1ms)
//     1.4.5 Valid Numeric tutor type entered (1)
//     1.4.6 Valid Numeric tutor type entered (2)
//     1.4.7 Valid Numeric tutor type entered (3) (1ms)
//   1.5 No Parameters or Valid User
//     1.5.1 No parameters passed in
//     1.5.2 Valid User Created (124ms)
// 2. Test Get Tutor
//   2.1 No token passed (1ms)
//   2.2 Blank token passed
//   2.3 Incorrect token passed (2ms)
//   2.4 Valid token passed (4ms)
// 3. Test Update Tutor
//   3.1 No token and no body passed
//   3.2 Blank token passed (1ms)
//   3.3 Incorrect token passed (1ms)
//   3.4 Valid token passed and no body (1ms)
//   3.5 Valid token passed and invalid username
//   3.6 Valid token passed and invalid email (4ms)
//   3.7 Valid token passed and invalid password (1ms)
//   3.8 Valid token and update details (143ms)
// 4. Test Delete Tutor
//   4.1 No token passed
//   4.2 Blank token passed
//   4.3 Incorrect token passed (1ms)
//   4.4 Valid token passed (28ms)

beforeAll( async () => {

    try {
        await db.connectToDB();
        
        await db.saveData( `DELETE FROM smt_user_login WHERE username like 'tutor_reg%' `);

        event = {
            httpMethod: 'POST',
            body: "{}",
            headers: {
                'Content-Type': 'application/json'
            }
        };

        let sendBody = { 
            username: 'tutor_reg_get_test_1',
            email: 'get@get.co.uk',
            password: 'Hello123',
            password2: 'Hello123',
            type: '3' 
        };

        event.body=JSON.stringify(sendBody);
        let res = await tutor.tutorHandler(event);
        let body = JSON.parse(res.body);
        readToken =  body.token;

        sendBody = { 
            username: 'tutor_reg_update_test_1',
            email: 'update@update.co.uk',
            password: 'Hello123',
            password2: 'Hello123',
            type: '3' 
        };
        event.body=JSON.stringify(sendBody);
        res = await tutor.tutorHandler(event);
        body = JSON.parse(res.body);
        updateToken =  body.token;

        sendBody = { 
            username: 'tutor_reg_delete_test_1',
            email: 'delete@delete.co.uk',
            password: 'Hello123',
            password2: 'Hello123',
            type: '3' 
        };
        event.body=JSON.stringify(sendBody);
        res = await tutor.tutorHandler(event);
        body = JSON.parse(res.body);
        deleteToken =  body.token;

        // Create tutor and delete them to get token for tutor that doesnt exist
        sendBody = { 
            username: 'tutor_reg_create_del_test_1',
            email: 'delete@delete.co.uk',
            password: 'Hello123',
            password2: 'Hello123',
            type: '3' 
        };
        event.body=JSON.stringify(sendBody);
        res = await tutor.tutorHandler(event);
        body = JSON.parse(res.body);
        createDeleteToken =  body.token;

        event = {
            httpMethod: 'DELETE',
            body: "{}",
            headers: {
                'Content-Type': 'application/json'
            }
        };
        event.headers['X-Auth-Token'] = createDeleteToken;

        res = await tutor.tutorHandler(event);
        body = JSON.parse(res.body);


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


describe ( '1. Test Create Tutor', () => {

    beforeAll( async () => {
        event = {
            httpMethod: 'POST',
            body: "{}",
            headers: {
                'Content-Type': 'application/json'
            }
        };
    });

    describe ('1.1 Username validation Checks', () => {

        test ('1.1.1 No username entered', async () => {

            try {
                const sendBody = { };
                // event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.username).toBe('Username has to be 6 - 30 characters and can contain your email address.');
            } catch (err) {
                console.error (err);
            }
    
        });
    
        test ('1.1.2 Username too short', async () => {

            try {
                const sendBody = { username: 'Dad' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.username).toBe('Username has to be 6 - 30 characters and can contain your email address.');
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.1.3 Username too long', async () => {

            try {
                const sendBody = { username: 'Dad4567890123456789012345678901' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.username).toBe('Username has to be 6 - 30 characters and can contain your email address.');
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.1.4 Username can contain uppercase characters', async () => {

            try {
                const sendBody = { username: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' };

                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.username).toBeNull();
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.1.5 Username can contain lowercase characters', async () => {

            try {
                const sendBody = { username: 'abcdefghijklmnopqrstuvwxyz' };

                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.username).toBeNull();
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.1.6 Username can contain numbers', async () => {

            try {
                const sendBody = { username: '01234567890' };

                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.username).toBeNull();
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.1.7 Username can contain email characters (first set)', async () => {

            try {
                const sendBody = { username: '!#$%&\'*+-/=?^_`{|}~. ()' };

                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.username).toBeNull();
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.1.8 Username can contain email characters (second set)', async () => {

            try {
                const sendBody = { username: ',:;<>@[\\]' };

                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.username).toBeNull();
            } catch (err) {
                console.error (err);
            }
    
        });

    });


    describe ( '1.2 Email validation checks', () => {

        test ('1.2.1 No email entered', async () => {

            try {
                const sendBody = { };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.email).toBe('A valid email address needs to be entered.');
            } catch (err) {
                console.error (err);
            }
    
        });


        test ('1.2.2 A blank email', async () => {

            try {
                const sendBody = { email: '' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.email).toBe('A valid email address needs to be entered.');
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.2.3 An invalid email (dad)', async () => {

            try {
                const sendBody = { email: 'dad' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.email).toBe('A valid email address needs to be entered.');
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.2.4 An invalid email (dad@)', async () => {

            try {
                const sendBody = { email: 'dad@' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.email).toBe('A valid email address needs to be entered.');
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.2.5 An invalid email (dad@dad)', async () => {

            try {
                const sendBody = { email: 'dad@dad' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.email).toBe('A valid email address needs to be entered.');
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.2.6 A valid email', async () => {

            try {
                const sendBody = { email: 'dad@dad.co.uk' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.email).toBeNull();
            } catch (err) {
                console.error (err);
            }
    
        });

    });


    describe ( '1.3 Password(s) validation checks', () => {

        test ('1.3.1 No Passwords entered', async () => {

            try {
                const sendBody = {
                    password2: 'Hello123'
                };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.password).toBe('Your password needs to be 6 - 20 characters long and must contain at least one number.');
            } catch (err) {
                console.error (err);
            }
    
        });
        
        test ('1.3.2 Blank password entered', async () => {

            try {
                const sendBody = {
                    password: '', 
                    password2: 'Hello123'
                };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.password).toBe('Your password needs to be 6 - 20 characters long and must contain at least one number.');
            } catch (err) {
                console.error (err);
            }
    
        });
        
        test ('1.3.3 Password less than 6 characters', async () => {

            try {
                const sendBody = {
                    password: 'Abcd1', 
                    password2: 'Hello123'
                };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.password).toBe('Your password needs to be 6 - 20 characters long and must contain at least one number.');
            } catch (err) {
                console.error (err);
            }
    
        });
        
        test ('1.3.4 Password greater than 20 characters', async () => {

            try {
                const sendBody = {
                    password: 'Abcdefghilkmnopqrstu1', 
                    password2: 'Hello123' 
                };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.password).toBe('Your password needs to be 6 - 20 characters long and must contain at least one number.');
            } catch (err) {
                console.error (err);
            }
    
        });
        
        test ('1.3.5 Valid password, missing confirmation password', async () => {

            try {
                const sendBody = {
                    password: 'Hello123'
                };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.password).toBeNull();
                expect (body.error.password2).toBe('Your passwords must match.');
            } catch (err) {
                console.error (err);
            }
    
        });
        
        test ('1.3.6 Valid password, blank confirmation password', async () => {

            try {
                const sendBody = {
                    password: 'Hello123', 
                    password2: ''
                };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.password).toBeNull();
                expect (body.error.password2).toBe('Your passwords must match.');
            } catch (err) {
                console.error (err);
            }
    
        });
        
        test ('1.3.7 Valid passwords', async () => {

            try {
                const sendBody = {
                    password: 'Hello123', 
                    password2: 'Hello123'
                };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.password).toBeNull();
                expect (body.error.password2).toBeNull();
            } catch (err) {
                console.error (err);
            }
    
        });
        
    });

    describe ( '1.4 Tutor Type validation checks', () => {

        test ('1.4.1 No tutor type entered', async () => {

            try {
                const sendBody = { };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.type).toBe('The user type must be between 1 and 3.');
            } catch (err) {
                console.error (err);
            }
    
        });
        
        test ('1.4.2 Blank tutor type entered', async () => {

            try {
                const sendBody = { type: '' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.type).toBe('The user type must be between 1 and 3.');
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.4.3 Alphanumeric tutor type entered', async () => {

            try {
                const sendBody = { type: 'a' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.type).toBe('The user type must be between 1 and 3.');
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.4.4 Numeric tutor type entered that is out of range', async () => {

            try {
                const sendBody = { type: '4' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.type).toBe('The user type must be between 1 and 3.');
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.4.5 Valid Numeric tutor type entered (1)', async () => {

            try {
                const sendBody = { type: '1' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.type).toBeNull();
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.4.6 Valid Numeric tutor type entered (2)', async () => {

            try {
                const sendBody = { type: '2' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.type).toBeNull();
            } catch (err) {
                console.error (err);
            }
    
        });

        test ('1.4.7 Valid Numeric tutor type entered (3)', async () => {

            try {
                const sendBody = { type: '3' };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.type).toBeNull();
            } catch (err) {
                console.error (err);
            }
    
        });

    });

    describe ( '1.5 No Parameters or Valid User', () => {

        test ('1.5.1 No parameters passed in', async () => {

            try {
                const sendBody = { };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(200);
                expect (body.error.email).toBe('A valid email address needs to be entered.');
                expect (body.error.username).toBe('Username has to be 6 - 30 characters and can contain your email address.');
                expect (body.error.password).toBe('Your password needs to be 6 - 20 characters long and must contain at least one number.');
                expect (body.error.password2).toBeNull();
                expect (body.error.type).toBe('The user type must be between 1 and 3.');
            } catch (err) {
                console.error (err);
            }
    
        });
    
        test ('1.5.2 Valid User Created', async () => {

            try {
                const sendBody = { 
                    username: 'tutor_reg_create_user_test',
                    email: 'dad@dad.co.uk',
                    password: 'Hello123',
                    password2: 'Hello123',
                    type: '3' 
                };
                event.body=JSON.stringify(sendBody);
                const res = await tutor.tutorHandler(event);
                const body = JSON.parse(res.body);
                expect (res.statusCode).toBe(201);
                expect (body.error).toBeUndefined();
                expect (body.token).toBeDefined();
            } catch (err) {
                console.error (err);
            }
    
        });
    
    });

});

describe ( '2. Test Get Tutor', () => {

    beforeAll( async () => {
        event = {
            httpMethod: 'GET',
            body: "{}",
            headers: {
                'Content-Type': 'application/json'
            }
        };
    });

    test ( '2.1 No token passed', async () => {
        try {
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.msg).toBe('User is not signed in.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '2.2 Blank token passed', async () => {
        try {
            event.headers['X-Auth-Token'] = '';
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.msg).toBe('User is not signed in.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '2.3 Incorrect token passed', async () => {
        try {
            event.headers['X-Auth-Token'] = createDeleteToken;
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.msg).toBe('Mismatch between token id and database.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '2.4 Valid token passed', async () => {
        try {
            event.headers['X-Auth-Token'] = readToken;
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.data.rows).toBe(1);
            expect (body.data.user[0].email).toBe('get@get.co.uk');
        } catch (err) {
            console.error (err);
        }
    });

});

describe ( '3. Test Update Tutor', () => {

    beforeAll( async () => {
        event = {
            httpMethod: 'PUT',
            body: "{}",
            headers: {
                'Content-Type': 'application/json'
            }
        };
    });

    test ( '3.1 No token and no body passed', async () => {
        try {
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.msg).toBe('User is not signed in.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '3.2 Blank token passed', async () => {
        try {
            event.headers['X-Auth-Token'] = '';
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.msg).toBe('User is not signed in.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '3.3 Incorrect token passed', async () => {
        try {
            event.headers['X-Auth-Token'] = createDeleteToken;
            const sendBody = { 
                username: 'Changed',
                email: 'changed@update.co.uk',
                password: 'Hello123',
                password2: 'Hello123',
                type: '3' 
            };
            event.body=JSON.stringify(sendBody);
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.error.msg).toBe('User in token can not be found.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '3.4 Valid token passed and no body', async () => {
        try {
            event.headers['X-Auth-Token'] = updateToken;
            const sendBody = { 
            };
            event.body=JSON.stringify(sendBody);
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.error.email).toBe('A valid email address needs to be entered.');
            expect (body.error.username).toBe('Username has to be 6 - 30 characters and can contain your email address.');
            expect (body.error.password).toBe('Your password needs to be 6 - 20 characters long and must contain at least one number.');
            expect (body.error.password2).toBeNull();
            expect (body.error.type).toBe('The user type must be between 1 and 3.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '3.5 Valid token passed and invalid username', async () => {
        try {
            event.headers['X-Auth-Token'] = updateToken;
            const sendBody = { 
                username: 'd',
                email: 'changed@update.co.uk',
                password: 'Hello123',
                password2: 'Hello123',
                type: '3' 
            };
            event.body=JSON.stringify(sendBody);
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.error.username).toBe('Username has to be 6 - 30 characters and can contain your email address.');
        } catch (err) {
            console.error (err);
        }

    });

    test ( '3.6 Valid token passed and invalid email', async () => {
        try {
            event.headers['X-Auth-Token'] = updateToken;
            const sendBody = { 
                username: 'Changed',
                email: 'changed',
                password: 'Hello123',
                password2: 'Hello123',
                type: '3' 
            };
            event.body=JSON.stringify(sendBody);
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.error.email).toBe('A valid email address needs to be entered.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '3.7 Valid token passed and invalid password', async () => {
        try {
            event.headers['X-Auth-Token'] = updateToken;
            const sendBody = { 
                username: 'tutor_reg_changed_test_1',
                email: 'changed@changed.co.uk',
                password: 'Hello',
                password2: 'Hell',
                type: '3' 
            };
            event.body=JSON.stringify(sendBody);
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.error.password).toBe('Your password needs to be 6 - 20 characters long and must contain at least one number.');
            expect (body.error.password2).toBe('Your passwords must match.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '3.8 Valid token and update details', async () => {
        try {
            event.headers['X-Auth-Token'] = updateToken;
            const sendBody = { 
                username: 'tutor_reg_changed_test_3',
                email: 'changed@changed.co.uk',
                password: 'Hello123',
                password2: 'Hello123',
                type: '3' 
            };
            event.body=JSON.stringify(sendBody);
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            if (res.statusCode != 201) console.log ('[ERROR] 3.8 Valid token and update details')
            expect (res.statusCode).toBe(201);
            expect (body.msg).toBe('Account updated.');
        } catch (err) {
            console.error (err);
        }
    });

});

describe ( '4. Test Delete Tutor', () => {

    beforeAll( async () => {
        event = {
            httpMethod: 'DELETE',
            body: "{}",
            headers: {
                'Content-Type': 'application/json'
            }
        };
    });

    test ( '4.1 No token passed', async () => {
        try {
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.msg).toBe('User is not signed in.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '4.2 Blank token passed', async () => {
        try {
            event.headers['X-Auth-Token'] = '';
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.msg).toBe('User is not signed in.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '4.3 Incorrect token passed', async () => {
        try {
            event.headers['X-Auth-Token'] = createDeleteToken;
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(200);
            expect (body.msg).toBe('The tutor is already deleted.');
        } catch (err) {
            console.error (err);
        }
    });

    test ( '4.4 Valid token passed', async () => {
        try {
            event.headers['X-Auth-Token'] = deleteToken;
            const res = await tutor.tutorHandler(event);
            const body = JSON.parse(res.body);
            expect (res.statusCode).toBe(201);
            expect (body.msg).toBe('Account deleted.');
        } catch (err) {
            console.error (err);
        }
    });

});


