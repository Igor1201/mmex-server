const Dropbox = require('dropbox');
const fs = require('mz/fs');
const dblite = require('dblite');
const express = require('express');
const bodyParser = require('body-parser');
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

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;

app.get('/payee', getAll(db, 'PAYEE_V1'));
app.get('/payee/:PAYEENAME', getOneBy(db, 'PAYEE_V1', 'PAYEENAME'));
app.post('/payee', insert(db, dbx, 'PAYEE_V1'));

app.get('/transaction', getAll(db, 'CHECKINGACCOUNT_V1'));
app.get('/transaction/:TRANSID', getOneBy(db, 'CHECKINGACCOUNT_V1', 'TRANSID'));
app.post('/transaction', insert(db, dbx, 'CHECKINGACCOUNT_V1'));

dbx.filesDownload({ path: process.env.DROPBOX_FILE_PATH })
  .then((file) => {
    return fs.writeFile(file.name, file.fileBinary, 'binary').then(() => file.name);
  })
  .then((fileName) => db.set(dblite(fileName, '-header'), fileName))
  .then(() => app.listen(PORT))
  .then(() => console.log('Server started.'))
  .catch((err) => console.error(err.stack));

//db.set(dblite('new.mmb', '-header'));
//app.listen(PORT);