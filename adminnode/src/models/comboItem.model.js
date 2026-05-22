const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ComboItem = sequelize.define(
    "ComboItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      comboId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "combos",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      // Specific variant optional
      variantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "product_variants",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      // Quantity of this product in the combo
      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
      // Position/order in combo
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "combo_items",
      timestamps: true,
      indexes: [
        { fields: ["comboId"] },
        { fields: ["productId"] },
        { fields: ["variantId"] },
      ],
    }
  );

  return ComboItem;
};
