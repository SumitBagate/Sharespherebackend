const express = require('express');
const { addLike, removeLike, addComment, getComments } = require('../controllers/likecomment');
const auth = require('../middleware/auth'); // Ensures user is authenticated

const router = express.Router();

router.post('/like/:fileId', auth, addLike);
router.delete('/like/:fileId', auth, removeLike);
router.post('/comment/:fileId', auth, addComment);
router.get('/comment/:fileId', getComments);

module.exports = router;
