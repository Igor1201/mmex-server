const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const { getAll, getOneBy, insert } = require('./db-helpers');
const { file } = require('./file-helpers');

passport.use(new BasicStrategy((user, pass, done) => {
  if (user === process.env.USER && pass === process.env.PASSWORD) return done(null, user);
  return done(null, false);
}));

const app = express();
app.use(helmet());
app.use(bodyParser.json());

const auth = passport.authenticate('basic', { session: false });

app.get('/payee', auth, getAll(file, 'PAYEE_V1'));
app.get('/payee/:PAYEENAME', auth, getOneBy(file, 'PAYEE_V1', 'PAYEENAME'));
app.post('/payee', auth, insert(file, 'PAYEE_V1'));

app.get('/transaction', auth, getAll(file, 'CHECKINGACCOUNT_V1'));
app.get('/transaction/:TRANSID', auth, getOneBy(file, 'CHECKINGACCOUNT_V1', 'TRANSID'));
app.post('/transaction', auth, insert(file, 'CHECKINGACCOUNT_V1'));

// https stuff
const lex = require('letsencrypt-express').create({
  server: 'https://acme-v01.api.letsencrypt.org/directory',
  agreeTos: true,
  email: 'igor@borges.me',
  approveDomains: ['vm.borges.me']
});

Promise.resolve()
  //.then(() => app.listen(3000))
  .then(() => require('http').createServer(lex.middleware(require('redirect-https')())).listen(80))
  .then(() => require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443))
  .then(() => console.log('Server started.'))
  .catch((err) => console.error(err.stack));
