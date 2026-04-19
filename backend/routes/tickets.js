const express = require('express');
const router  = express.Router();
const { getAll, create, update, remove, getComments, addComment } = require('../controllers/ticketsController');

router.get('/',                 getAll);
router.post('/',                create);
router.put('/:id',              update);
router.delete('/:id',           remove);
router.get('/:id/comments',     getComments);
router.post('/:id/comments',    addComment);

module.exports = router;
