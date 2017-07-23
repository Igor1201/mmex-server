const __ = require('lodash');
const fs = require('mz/fs');

const getAll = (db, table) => {
  return (req, res) => {
    db.get().query(`SELECT * FROM ${table}`, (err, items) => {
      if (err) {
        res.status(500);
        return res.send({ error: err.stack });
      }

      return res.send(JSON.stringify(items));
    });
  };
};

const getOneBy = (db, table, column) => {
  return (req, res) => {
    db.get().query(`SELECT * FROM ${table} WHERE ${column} = :value`, { value: req.params[column] }, (err, items) => {
      if (err) {
        res.status(500);
        return res.send({ error: err.stack });
      }

      res.status(items && items[0] ? 200 : 404);
      return res.send(items[0]);
    })
  };
};

const commitAndUpload = (db, dbx) => {
  return fs.readFile(db.getFileName())
    .then((contents) => {
      return dbx.filesUpload({ path: process.env.DROPBOX_FILE_PATH, contents: contents, mode: 'overwrite' });
    });
};

const insert = (db, dbx, table) => {
  return (req, res) => {
    const keys = __.keys(req.body);
    const query = `INSERT INTO ${table} (${__.join(keys, ', ')}) VALUES (:${__.join(keys, ', :')})`;

    db.get().query(query, req.body, (err) => {
      if (err) {
        res.status(500);
        return res.send({ error: err.stack });
      }

      db.get().lastRowID(table, (rowId) => {
        commitAndUpload(db, dbx)
          .then(() => {
            return res.send({ rowId });
          })
          .catch((err) => {
            res.status(500);
            return res.send({ error: err.stack });
          });
      });
    });
  };
};

module.exports = { getAll, getOneBy, insert };