const Dropbox = require('dropbox');
const fs = require('mz/fs');
const dblite = require('dblite');
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const { getAll, getOneBy, insert } = require('./db-helpers');

const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_KEY });

const db = {
  db: null,
  fileName: null,
  getFileName: () => this.fileName,
  get: () => this.db,
  set: (db, fileName) => {
    this.db = db;
    this.fileName = fileName;
  },
};

passport.use(new BasicStrategy((user, pass, done) => {
  if (user === process.env.USER && pass === process.env.PASSWORD) return done(null, user);
  return done(null, false);
}));

const app = express();
app.use(helmet());
app.use(passport.authenticate('basic', { session: false }));
app.use(bodyParser.json());

app.get('/payee', getAll(db, 'PAYEE_V1'));
app.get('/payee/:PAYEENAME', getOneBy(db, 'PAYEE_V1', 'PAYEENAME'));
app.post('/payee', insert(db, dbx, 'PAYEE_V1'));

app.get('/transaction', getAll(db, 'CHECKINGACCOUNT_V1'));
app.get('/transaction/:TRANSID', getOneBy(db, 'CHECKINGACCOUNT_V1', 'TRANSID'));
app.post('/transaction', insert(db, dbx, 'CHECKINGACCOUNT_V1'));

// https stuff
const lex = require('letsencrypt-express').create({
  server: 'https://acme-staging.api.letsencrypt.org/directory',
  approveDomains: ['vm.borges.me']
});

dbx.filesDownload({ path: process.env.DROPBOX_FILE_PATH })
  .then((file) => {
    return fs.writeFile(file.name, file.fileBinary, 'binary').then(() => file.name);
  })
  .then((fileName) => db.set(dblite(fileName, '-header'), fileName))
  //.then(() => app.listen(3000))
  .then(() => require('http').createServer(lex.middleware(require('redirect-https')())).listen(80))
  .then(() => require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443))
  .then(() => console.log('Server started.'))
  .catch((err) => console.error(err.stack));
