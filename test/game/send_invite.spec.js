const supertest = require('supertest');
const { expect } = require('chai');
const app = require('../../server');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const request = supertest(app);

// test for register(sign up) controller
describe('POST /api/auth/signup', () => {
  const mockData1 = {
    name: 'ade',
    email: 'testname@test.com',
    password: 'password'
  };
  const mockData2 = {
    name: 'bunmi',
    email: 'testname@test.com',
    password: 'password'
  };
  // establish a database connection before each test
  beforeEach((done) => {
    mongoose.connect(process.env.TEST_DB_URL, () => {
      const user1 = new User(mockData1);
      const user2 = new User(mockData2);
      user1.save();
      user1.save();
      done();
    });
  });

  // drop the database after each test
  afterEach((done) => {
    mongoose.connection.db.dropDatabase(() => {
      done();
    });
  });

  it('should successful search for user', (done) => {
    request
      .post('/api/search/users')
      .send({
        username: 'ade',
        value: 'ade',
      })
      .end((err, res) => {
        // expect(res.statusCode).to.equal(200);
        expect(res.body.status).to.equal('sucessful');
        expect(res.body.message).to.equal('User found');
        done();
      });
  });

  it('should return a 404 if user not found', (done) => {
    request
      .post('/api/search/users')
      .send({
        username: 'bunmip',
        value: 'ade',
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(404);
        expect(res.body.status).to.equal('Unsucessful');
        expect(res.body.message).to.equal('User not found on db');
        done();
      });
  });

  it('should return a 500 if user does not exist', (done) => {
    request
      .post('/api/search/users')
      .send({
        username: 'bunmip',
        value: 'ade09',
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(500);
        expect(res.body.error).to.equal('An error occured!');
        done();
      });
  });
});
