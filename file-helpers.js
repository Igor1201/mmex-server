const Dropbox = require('dropbox');
const fs = require('mz/fs');
const dblite = require('dblite');
const thenifyAll = require('thenify-all');

const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_KEY });

const download = () => {
  return dbx.filesDownload({ path: process.env.DROPBOX_FILE_PATH })
    .then((f) => {
      return fs.writeFile('db.mmb', f.fileBinary, 'binary');
    })
    .then(() => file.setDb(dblite('db.mmb', '-header')))
};

const upload = () => {
  return fs.readFile('db.mmb')
    .then((contents) => dbx.filesUpload({ path: process.env.DROPBOX_FILE_PATH, contents: contents, mode: 'overwrite' }));
};

const file = {
  db: null,
  getDb: () => Promise.resolve(this.db),
  setDb: (db) => {
    return new Promise((resolve) => {
      this.db = thenifyAll(db, {}, ['query', 'close', 'lastRowID']);
      resolve();
    });
  },
  download,
  upload
};

module.exports = { file };
