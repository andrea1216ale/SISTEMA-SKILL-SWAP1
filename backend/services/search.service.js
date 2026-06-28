const Search = require('../models/search.model');

const cleanText = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

exports.search = async (query) => {
  const userId = Number(query.userId);
  if (!Number.isInteger(userId) || userId < 1) {
    const error = new Error('Usuario inválido.');
    error.status = 400;
    throw error;
  }
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(20, Math.max(1, Number.parseInt(query.limit, 10) || 8));
  const term = cleanText(query.q, 80);
  const category = cleanText(query.category, 100);
  const [{ results, total }, categories] = await Promise.all([
    Search.findPeopleBySkill({ userId, term, category, page, limit }),
    Search.findCategories()
  ]);
  return { results, categories, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};
