const express = require('express');
const router  = express.Router();
const { updateAvatar, updateRole, getAllUsers, editUser, getStaffUsers } = require('../controllers/usersController');

router.patch('/avatar', updateAvatar);
router.patch('/role',   updateRole);
router.get('/staff',    getStaffUsers);
router.get('/all',      getAllUsers);
router.patch('/edit',   editUser);

module.exports = router;
