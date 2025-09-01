const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');

router.post('/v1/product/create', productController.createProduct);
router.get('/v1/product/list', productController.getAllProducts);
router.get('/v1/product/:id', productController.getDetailProduct);

module.exports = router;