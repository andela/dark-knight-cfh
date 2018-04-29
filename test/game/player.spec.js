const supertest = require('supertest');
const { expect } = require('chai');
const app = require('../../server');
const mongoose = require('mongoose');

// const Game = mongoose.model('Game');
const User = mongoose.model('User');
const request = supertest(app);

// test for register(sign up) controller
describe('POST /api/games/5/start', () => {
  const mockData1 = {
    name: 'testname',
    email: 'testname@test.com',
    password: 'password'
  };

  // establish a database connection before each test
  beforeEach((done) => {
    mongoose.connect(process.env.TEST_DB_URL, () => {
      const user = new User(mockData1);
      user.save();
      done();
    });
  });

  // drop the database after each test
  afterEach((done) => {
    mongoose.connection.db.dropDatabase(() => {
      done();
    });
  });

  it('should successfully create a Game history', (done) => {
    request
      .post('/api/games/1/start')
      .send({
        winner: 'testname',
        players: ['ademola2@gmail.com'],
        level: 'beginner'
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(201);
        expect(res.body.status).to.equal('successful');
        expect(res.body.doc.points).to.equal(1);
        done();
      });
  });

  it('should return 500 if the user doesnt exist', (done) => {
    request
      .post('/api/games/1/start')
      .send({
        winner: 'testname78',
        players: ['ademola2@gmail.com'],
        level: 'beginner'
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(500);
        expect(res.body.status).to.equal('Unsuccessful');
        done();
      });
  });
});

