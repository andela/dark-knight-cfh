const supertest = require('supertest');
const { expect } = require('chai');
const app = require('../../server');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const dotenv = require('dotenv').config();
const request = supertest(app);

// test for register(sign up) controller
describe('POST /api/auth/signup', () => {
  let mockData = {
    name: 'testname',
    email: 'testname@test.com',
    password: 'password'
  };

  // establish a datbase connection before each test
  beforeEach(done => {
    mongoose.connect(process.env.TEST_DB_URL, function() {
      done();
    });
  });

  // drop the database after each test 
  afterEach(done => {
    mongoose.connection.db.dropDatabase(function() {
      done();
    });
  });

  it('should create a new user and return a token', done => {
    request
      .post('/api/auth/signup')
      .send({
        name: 'ademola',
        email: 'ademola2@gmail.com',
        password: 'ademola'
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(201);
        expect(res.body.success).to.equal(true);
        expect(res.body.message).to.equal('Registration successful!');
        expect(res.body.token).to.not.equal(null);
        done();
      });
  });

  it('should return an error if password is not provided', done => {
    request
      .post('/api/auth/signup')
      .send({
        name: 'testname',
        email: 'testname@test.com'
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        expect(res.body.success).to.equal(false);
        expect(res.body.message).to.equal('Enter all the fields to signup');
        done();
      });
  });

  it('should return an error if email is not provided', done => {
    request
      .post('/api/auth/signup')
      .send({
        name: 'testname',
        password: 'test'
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        expect(res.body.success).to.equal(false);
        expect(res.body.message).to.equal('Enter all the fields to signup');
        done();
      });
  });

  it('should return an error if name ise not provided', done => {
    request
      .post('/api/auth/signup')
      .send({
        password: 'testname',
        email: 'testname@test.com'
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        expect(res.body.success).to.equal(false);
        expect(res.body.message).to.equal('Enter all the fields to signup');
        done();
      });
  });

  it('should return an error if the user already registered', () => {
    request
      .post('/api/auth/signup')
      .send(Object.assign({}, mockData))
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        expect(res.body.success).to.equal(false);
        expect(res.body.message).to.equal('This user already exists!');
        done();
      });
  });
});
