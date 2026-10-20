class CreateProducts < ActiveRecord::Migration[7.2]
  def change
    create_table :products do |t|
      t.string :name, null: false
      t.string :slug, null: false, index: { unique: true }
      t.integer :price_pence, null: false
      t.integer :lead_time_days, null: false, default: 0
      t.integer :stock, null: false, default: 0
      t.string :image_url

      t.timestamps
    end

    add_check_constraint :products, "price_pence >= 0", name: "products_price_pence_non_negative"
    add_check_constraint :products, "lead_time_days >= 0", name: "products_lead_time_days_non_negative"
    add_check_constraint :products, "stock >= 0", name: "products_stock_non_negative"
  end
end
