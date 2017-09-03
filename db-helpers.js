const __ = require('lodash');

const throwError = (res, status) => {
  return (err) => {
    return res.status(status || 500).json({ error: err.message });
  };
};

const getAll = (file, table) => {
  return (req, res) => {
    return file.download()
      .then(file.getDb)
      .then((db) => db.query(`SELECT * FROM ${table}`))
      .then((items) => res.json(items))
      .catch(throwError(res));
  };
};

const getOneBy = (file, table, column) => {
  return (req, res) => {
    return file.download()
      .then(file.getDb)
      .then((db) => db.query(`SELECT * FROM ${table} WHERE ${column} = :value`, { value: req.params[column] }))
      .then((items) => {
        return res
          .status(items && items[0] ? 200 : 404)
          .json(items[0]);
      })
      .catch(throwError(res));
  };
};

const deleteOneBy = (file, table, column) => {
  return (req, res) => {
    return file.download()
      .then(file.getDb)
      .then((db) => db.query(`DELETE FROM ${table} WHERE ${column} = :value`, { value: req.params[column] }))
      .then(file.upload)
      .then(file.getDb)
      .then((db) => db.query(`SELECT changes() as changes`))
      .then((items) => {
        return res
          .status(items && items[0] && parseInt(items[0]['changes']) >= 1 ? 200 : 404)
          .json(items[0]);
      })
      .then(file.getDb)
      .then((db) => db.close())
      .catch(throwError(res));
  };
};

const insert = (file, table) => {
  return (req, res) => {
    const keys = __.keys(req.body);
    const query = `INSERT INTO ${table} (${__.join(keys, ', ')}) VALUES (:${__.join(keys, ', :')})`;

    return file.download()
      .then(file.getDb)
      .then((db) => db.query(query, req.body))
		  .catch(throwError(res, 400))
      .then(file.upload)
      .then(file.getDb)
      .then((db) => new Promise((resolve) => {
        db.lastRowID(table, (rowId) => resolve(rowId));
      }))
      .then((rowId) => res.json({ rowId }))
      .then(file.getDb)
      .then((db) => db.close())
      .catch(throwError(res));
  };
};

module.exports = { getAll, getOneBy, insert, deleteOneBy };
