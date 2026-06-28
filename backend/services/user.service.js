const User = require('../models/user.model');

exports.getAll = async () => {
  return User.findAll();
};

exports.getById = async (id) => {
  return User.findById(id);
};

exports.update = async (id, data) => {
  return User.update(id, data);
};

exports.remove = async (id) => {
  return User.remove(id);
};
