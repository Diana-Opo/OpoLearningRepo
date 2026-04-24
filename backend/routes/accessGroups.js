const express = require('express');
const router  = express.Router();
const { getGroups, createGroup, updateGroup, deleteGroup } = require('../controllers/accessGroupsController');

router.get('/',     getGroups);
router.post('/',    createGroup);
router.put('/:id',  updateGroup);
router.delete('/:id', deleteGroup);

module.exports = router;
