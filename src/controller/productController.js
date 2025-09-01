const product = require('../model/product');

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, discount, image, like, sell } = req.body;

    // Kiểm tra tên trùng
    const existName = await product.findOne({ where: { name } });
    if (existName) {
      return res.status(400).json({ message: 'Product name already exists' });
    }

    // Kiểm tra giá sản phẩm hợp lệ
    if (price <= 0) {
      return res.status(400).json({ message: 'Invalid product price' });
    }

    // Kiểm tra hàng tồn kho hợp lệ
    if (stock < 0) {
      return res.status(400).json({ message: 'Invalid product stock' });
    }

    // Kiểm tra discount hợp lệ
    if (discount < 0 || discount > 100) {
      return res.status(400).json({ message: 'Invalid product discount' });
    }

    const newProduct = await product.create({
      name,
      description,
      price,
      stock,
      category,
      discount,
      image,
      like,
      sell
    });

    return res.status(200).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    // Lấy sản phẩm mới nhất (08 sp)
    const latestProducts = await product.findAll({
      order: [['createdAt', 'DESC']],
      limit: 8,
    });

    // Lấy sản phẩm bán chạy nhất (06 sp) → dựa trên like
    const bestSellingProducts = await product.findAll({
      order: [['sell', 'DESC']],
      limit: 6,
    });

    // Lấy sản phẩm được xem nhiều nhất (08 sp)
    const mostViewedProducts = await product.findAll({
      order: [['view', 'DESC']],
      limit: 8,
    });

    // Lấy sản phẩm khuyến mãi cao nhất (04 sp)
    const highestDiscountProducts = await product.findAll({
      order: [['discount', 'DESC']],
      limit: 4,
    });

    // Format dữ liệu: thêm giá sau khi discount
    const formatProducts = (list) =>
      list.map((item) => {
        const discountedPrice = item.price - (item.price * (item.discount / 100));
        return { ...item.toJSON(), discountedPrice };
      });

    return res.status(200).json({
      latestProducts: formatProducts(latestProducts),
      bestSellingProducts: formatProducts(bestSellingProducts),
      mostViewedProducts: formatProducts(mostViewedProducts),
      highestDiscountProducts: formatProducts(highestDiscountProducts),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getDetailProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productDetail = await product.findByPk(id);

    if (!productDetail) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Mỗi lần user truy cập thì view tăng 1
    productDetail.view += 1;
    await productDetail.save();

    // Hiển thị giá sau khi áp dụng discount và giá gốc
    const discountedPrice = productDetail.price - (productDetail.price * (productDetail.discount / 100));
    const productWithDiscount = { ...productDetail.toJSON(), discountedPrice };

    return res.status(200).json({ product: productWithDiscount });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
