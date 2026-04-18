const express = require('express');
const router  = express.Router();
const { getAll, getArchived, create, update, remove } = require('../controllers/agentsController');

router.get('/archived', getArchived);
router.get('/',         getAll);
router.post('/',        create);
router.put('/:id',      update);
router.delete('/:id',   remove);

module.exports = router;
