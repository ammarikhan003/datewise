class CreateDeliveryDays < ActiveRecord::Migration[7.2]
  def change
    create_table :delivery_days do |t|
      t.date :date, null: false, index: { unique: true }
      t.integer :capacity, null: false, default: 50
      t.boolean :closed, null: false, default: false
      t.string :closed_reason

      t.timestamps
    end

    add_check_constraint :delivery_days, "capacity >= 0", name: "delivery_days_capacity_non_negative"
  end
end
