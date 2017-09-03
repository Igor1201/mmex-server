const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const { getAll, getOneBy, insert, deleteOneBy, updateOneBy, customQuery } = require('./db-helpers');
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
app.delete('/payee/:PAYEENAME', auth, deleteOneBy(file, 'PAYEE_V1', 'PAYEENAME'));
app.put('/payee/:PAYEENAME', auth, updateOneBy(file, 'PAYEE_V1', 'PAYEENAME'));

app.get('/transaction', auth, getAll(file, 'CHECKINGACCOUNT_V1'));
app.get('/transaction/:TRANSID', auth, getOneBy(file, 'CHECKINGACCOUNT_V1', 'TRANSID'));
app.post('/transaction', auth, insert(file, 'CHECKINGACCOUNT_V1'));
app.delete('/transaction/:TRANSID', auth, deleteOneBy(file, 'CHECKINGACCOUNT_V1', 'TRANSID'));
app.put('/transaction/:TRANSID', auth, updateOneBy(file, 'CHECKINGACCOUNT_V1', 'TRANSID'));

app.get('/category', auth, getAll(file, 'CATEGORY_V1'));
app.get('/category/:CATEGNAME', auth, getOneBy(file, 'CATEGORY_V1', 'CATEGNAME'));
app.post('/category', auth, insert(file, 'CATEGORY_V1'));
app.delete('/category/:CATEGNAME', auth, deleteOneBy(file, 'CATEGORY_V1', 'CATEGNAME'));
app.put('/category/:CATEGNAME', auth, updateOneBy(file, 'CATEGORY_V1', 'CATEGNAME'));

app.get('/subcategory', auth, getAll(file, 'SUBCATEGORY_V1'));
app.get('/subcategory/:SUBCATEGNAME', auth, getOneBy(file, 'SUBCATEGORY_V1', 'SUBCATEGNAME'));
app.post('/subcategory', auth, insert(file, 'SUBCATEGORY_V1'));
app.delete('/subcategory/:SUBCATEGNAME', auth, deleteOneBy(file, 'SUBCATEGORY_V1', 'SUBCATEGNAME'));
app.put('/subcategory/:SUBCATEGNAME', auth, updateOneBy(file, 'SUBCATEGORY_V1', 'SUBCATEGNAME'));

app.get('/account', auth, getAll(file, 'ACCOUNTLIST_V1'));
app.get('/account/:ACCOUNTNAME', auth, getOneBy(file, 'ACCOUNTLIST_V1', 'ACCOUNTNAME'));
app.post('/account', auth, insert(file, 'ACCOUNTLIST_V1'));
app.delete('/account/:ACCOUNTNAME', auth, deleteOneBy(file, 'ACCOUNTLIST_V1', 'ACCOUNTNAME'));
app.put('/account/:ACCOUNTNAME', auth, updateOneBy(file, 'ACCOUNTLIST_V1', 'ACCOUNTNAME'));

app.get('/custom/categories', auth, customQuery(file, 'SELECT c.CATEGID,c.CATEGNAME,s.SUBCATEGID,s.SUBCATEGNAME FROM CATEGORY_V1 AS c LEFT OUTER JOIN SUBCATEGORY_V1 AS s USING(CATEGID) UNION SELECT CATEGID,CATEGNAME,null,null FROM CATEGORY_V1'));

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
