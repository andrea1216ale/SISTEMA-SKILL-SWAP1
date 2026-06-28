const userService = require('../services/user.service');

exports.getAll = async (req, res, next) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await userService.update(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await userService.remove(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
