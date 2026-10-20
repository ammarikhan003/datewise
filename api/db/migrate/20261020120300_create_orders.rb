class CreateOrders < ActiveRecord::Migration[7.2]
  def change
    create_table :orders do |t|
      t.references :product, null: false, foreign_key: true
      t.date :delivery_date, null: false, index: true
      t.string :customer_name, null: false
      t.string :email, null: false
      t.text :address, null: false
      t.string :status, null: false, default: "confirmed"

      t.timestamps
    end
  end
end
