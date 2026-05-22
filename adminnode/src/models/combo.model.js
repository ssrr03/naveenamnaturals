const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Combo = sequelize.define(
    "Combo",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // 🏷️ Basic Info
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // 💰 Pricing
      comboPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      originalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      discount: {
        type: DataTypes.DECIMAL(5, 2), // Discount percentage
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      // 🖼️ Media
      images: {
        type: DataTypes.JSON, // ["image1.png", "image2.png"]
        allowNull: true,
        defaultValue: [],
      },
      // 📋 Combo Info
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "categories",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      // Product count in combo
      productCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      // 🏷️ Tag (new, sale, bestseller, etc.)
      tag: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // ⚙️ Status
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      sold: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      // SEO
      metaTitle: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      metaDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      seoKeywords: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      tableName: "combos",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["slug"] },
        { fields: ["categoryId"] },
        { fields: ["isActive"] },
        { fields: ["tag"] },
      ],
    }
  );

  return Combo;
};
