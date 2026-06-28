const User = require('../models/user.model');

exports.register = async (data) => {
  return User.create(data);
};

exports.login = async (data) => {
  return User.findByCredentials(data.correo, data.password);
};

exports.me = async (user) => {
  return user;
};
