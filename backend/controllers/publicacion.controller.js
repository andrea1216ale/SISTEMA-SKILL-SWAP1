const service = require('../services/publicacion.service');

const idFrom = (value) => { const id = Number(value); return Number.isInteger(id) && id > 0 ? id : null; };
const invalid = (res) => res.status(400).json({ error: 'El identificador no es valido.' });

exports.list = async (req, res, next) => { try { res.json(await service.list(req.query, Number(req.get('X-User-Id')) || 0)); } catch (e) { next(e); } };
exports.get = async (req, res, next) => { const id=idFrom(req.params.id); if(!id)return invalid(res); try { const item=await service.get(id,Number(req.get('X-User-Id'))||0); item ? res.json(item) : res.status(404).json({error:'Publicacion no encontrada.'}); } catch(e){next(e);} };
function baseUrl(req) { return `${req.protocol}://${req.get('host')}`; }

exports.create = async (req,res,next) => { try { const id=await service.create(req.user.id_usuario,req.body,req.files||[],baseUrl(req)); res.status(201).json(await service.get(id,req.user.id_usuario)); } catch(e){next(e);} };
exports.update = async (req,res,next) => { const id=idFrom(req.params.id); if(!id)return invalid(res); try { const result=await service.update(id,req.user.id_usuario,req.body,req.files||[],baseUrl(req)); if(result.status==='forbidden')return res.status(403).json({error:'No puedes editar publicaciones de otro usuario.'}); if(result.status==='missing')return res.status(404).json({error:'Publicacion no encontrada.'}); res.json(await service.get(id,req.user.id_usuario)); } catch(e){next(e);} };
exports.remove = async (req,res,next) => { const id=idFrom(req.params.id); if(!id)return invalid(res); try { const status=await service.remove(id,req.user.id_usuario); if(status==='forbidden')return res.status(403).json({error:'No puedes eliminar publicaciones de otro usuario.'}); if(status==='missing')return res.status(404).json({error:'Publicacion no encontrada.'}); res.status(204).end(); } catch(e){next(e);} };
exports.comments = async (req,res,next) => { const id=idFrom(req.params.id); if(!id)return invalid(res); try { res.json(await service.comments(id)); } catch(e){next(e);} };
exports.addComment = async (req,res,next) => { const id=idFrom(req.params.id); if(!id)return invalid(res); try { const commentId=await service.addComment(id,req.user.id_usuario,req.body); if(!commentId)return res.status(404).json({error:'Publicacion no encontrada.'}); const comments=await service.comments(id); const created=comments.find(c=>Number(c.id_comentario)===Number(commentId)); res.status(201).json(created); } catch(e){next(e);} };
exports.deleteComment = async (req,res,next) => { const id=idFrom(req.params.id); if(!id)return invalid(res); try { const status=await service.deleteComment(id,req.user.id_usuario); if(status==='forbidden')return res.status(403).json({error:'No puedes eliminar comentarios de otro usuario.'}); if(status==='missing')return res.status(404).json({error:'Comentario no encontrado.'}); res.status(204).end(); } catch(e){next(e);} };
exports.react = async (req,res,next) => { const id=idFrom(req.params.id); if(!id)return invalid(res); try { const result=await service.react(id,req.user.id_usuario,req.body); result ? res.json(result) : res.status(404).json({error:'Publicacion no encontrada.'}); } catch(e){next(e);} };
exports.save = async (req,res,next) => { const id=idFrom(req.params.id); if(!id)return invalid(res); try { const saved=await service.save(id,req.user.id_usuario); saved===null ? res.status(404).json({error:'Publicacion no encontrada.'}) : res.json({guardada:saved}); } catch(e){next(e);} };
exports.saved = async (req,res,next) => { const id=idFrom(req.params.id); if(!id)return invalid(res); try { res.json(await service.saved(id,req.user.id_usuario)); } catch(e){next(e);} };
exports.skills = async (req,res,next) => { try { res.json(await service.skills()); } catch(e){next(e);} };
exports.idiomas = async (req,res,next) => { try { res.json(await service.idiomas()); } catch(e){next(e);} };
