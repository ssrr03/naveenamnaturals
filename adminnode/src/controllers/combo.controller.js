const db = require("../models");
const { Op } = require("sequelize");

const Combo = db.combo;
const ComboItem = db.comboItem;
const Product = db.product;
const ProductVariant = db.productVariant;

// ✅ Create a new combo
exports.createCombo = async (req, res) => {
  try {
    const { name, slug, description, comboPrice, originalPrice, discount, images, categoryId, tag, items } = req.body;

    // Validate required fields
    if (!name || !slug || comboPrice == null || originalPrice == null) {
      return res.status(400).json({
        message: "Name, slug, comboPrice, and originalPrice are required",
      });
    }

    // Check slug uniqueness
    const existingCombo = await Combo.findOne({ where: { slug } });
    if (existingCombo) {
      return res.status(409).json({
        message: "Combo with this slug already exists",
      });
    }

    // Create combo
    const combo = await Combo.create({
      name,
      slug,
      description,
      comboPrice,
      originalPrice,
      discount,
      images: images || [],
      categoryId,
      tag,
      productCount: (items || []).length,
    });

    // Add combo items if provided
    if (items && items.length > 0) {
      const comboItems = items.map((item, index) => ({
        comboId: combo.id,
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity || 1,
        sortOrder: index,
      }));

      await ComboItem.bulkCreate(comboItems);
    }

    // Fetch combo with items
    const createdCombo = await Combo.findByPk(combo.id, {
      include: [
        {
          model: ComboItem,
          as: "items",
          include: [
            { model: Product, as: "product", attributes: ["id", "name", "images"] },
            { model: ProductVariant, as: "variant", attributes: ["id", "name", "price"] },
          ],
        },
        { model: db.category, as: "category", attributes: ["id", "name"] },
      ],
    });

    res.status(201).json({
      message: "Combo created successfully",
      data: createdCombo,
    });
  } catch (error) {
    console.error("Error creating combo:", error);
    res.status(500).json({
      message: "Error creating combo",
      error: error.message,
    });
  }
};

// ✅ Get all combos
exports.getAllCombos = async (req, res) => {
  try {
    const { isActive, categoryId, tag, limit = 10, offset = 0 } = req.query;

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (categoryId) where.categoryId = categoryId;
    if (tag) where.tag = tag;

    const { count, rows } = await Combo.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: ComboItem,
          as: "items",
          include: [
            { model: Product, as: "product", attributes: ["id", "name", "images"] },
            { model: ProductVariant, as: "variant", attributes: ["id", "name", "price"] },
          ],
        },
        { model: db.category, as: "category", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error fetching combos:", error);
    res.status(500).json({
      message: "Error fetching combos",
      error: error.message,
    });
  }
};

// ✅ Get combo by ID
exports.getComboById = async (req, res) => {
  try {
    const { id } = req.params;

    const combo = await Combo.findByPk(id, {
      include: [
        {
          model: ComboItem,
          as: "items",
          include: [
            { model: Product, as: "product", attributes: ["id", "name", "images", "description"] },
            { model: ProductVariant, as: "variant", attributes: ["id", "name", "price", "sku"] },
          ],
        },
        { model: db.category, as: "category", attributes: ["id", "name"] },
      ],
    });

    if (!combo) {
      return res.status(404).json({ message: "Combo not found" });
    }

    res.json({ data: combo });
  } catch (error) {
    console.error("Error fetching combo:", error);
    res.status(500).json({
      message: "Error fetching combo",
      error: error.message,
    });
  }
};

// ✅ Update combo
exports.updateCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, comboPrice, originalPrice, discount, images, categoryId, tag, isActive, items } = req.body;

    const combo = await Combo.findByPk(id);
    if (!combo) {
      return res.status(404).json({ message: "Combo not found" });
    }

    // Check slug uniqueness if slug is being changed
    if (slug && slug !== combo.slug) {
      const existingCombo = await Combo.findOne({ where: { slug } });
      if (existingCombo) {
        return res.status(409).json({
          message: "Combo with this slug already exists",
        });
      }
    }

    // Update combo
    await combo.update({
      name: name || combo.name,
      slug: slug || combo.slug,
      description: description !== undefined ? description : combo.description,
      comboPrice: comboPrice !== undefined ? comboPrice : combo.comboPrice,
      originalPrice: originalPrice !== undefined ? originalPrice : combo.originalPrice,
      discount: discount !== undefined ? discount : combo.discount,
      images: images || combo.images,
      categoryId: categoryId !== undefined ? categoryId : combo.categoryId,
      tag: tag !== undefined ? tag : combo.tag,
      isActive: isActive !== undefined ? isActive : combo.isActive,
      productCount: items !== undefined ? (items || []).length : combo.productCount,
    });

    // Update combo items if provided
    if (items) {
      await ComboItem.destroy({ where: { comboId: id } });

      if (items.length > 0) {
        const comboItems = items.map((item, index) => ({
          comboId: id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity || 1,
          sortOrder: index,
        }));

        await ComboItem.bulkCreate(comboItems);
      }
    }

    // Fetch updated combo
    const updatedCombo = await Combo.findByPk(id, {
      include: [
        {
          model: ComboItem,
          as: "items",
          include: [
            { model: Product, as: "product", attributes: ["id", "name", "images"] },
            { model: ProductVariant, as: "variant", attributes: ["id", "name", "price"] },
          ],
        },
        { model: db.category, as: "category", attributes: ["id", "name"] },
      ],
    });

    res.json({
      message: "Combo updated successfully",
      data: updatedCombo,
    });
  } catch (error) {
    console.error("Error updating combo:", error);
    res.status(500).json({
      message: "Error updating combo",
      error: error.message,
    });
  }
};

// ✅ Delete combo
exports.deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;

    const combo = await Combo.findByPk(id);
    if (!combo) {
      return res.status(404).json({ message: "Combo not found" });
    }

    // Delete combo items first (cascade will handle it, but explicit for clarity)
    await ComboItem.destroy({ where: { comboId: id } });

    // Delete combo
    await combo.destroy();

    res.json({
      message: "Combo deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting combo:", error);
    res.status(500).json({
      message: "Error deleting combo",
      error: error.message,
    });
  }
};

// ✅ Get combos for website (public endpoint)
exports.getPublicCombos = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const { count, rows } = await Combo.findAndCountAll({
      where: { isActive: true },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: ComboItem,
          as: "items",
          include: [
            { model: Product, as: "product", attributes: ["id", "name", "images"] },
            { model: ProductVariant, as: "variant", attributes: ["id", "name", "price"] },
          ],
        },
        { model: db.category, as: "category", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error fetching public combos:", error);
    res.status(500).json({
      message: "Error fetching combos",
      error: error.message,
    });
  }
};

// ✅ Get combo by slug (public endpoint)
exports.getComboBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const combo = await Combo.findOne({
      where: { slug, isActive: true },
      include: [
        {
          model: ComboItem,
          as: "items",
          include: [
            { model: Product, as: "product" },
            { model: ProductVariant, as: "variant" },
          ],
        },
        { model: db.category, as: "category" },
      ],
    });

    if (!combo) {
      return res.status(404).json({ message: "Combo not found" });
    }

    res.json({ data: combo });
  } catch (error) {
    console.error("Error fetching combo by slug:", error);
    res.status(500).json({
      message: "Error fetching combo",
      error: error.message,
    });
  }
};
