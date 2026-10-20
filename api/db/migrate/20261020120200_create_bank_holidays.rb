class CreateBankHolidays < ActiveRecord::Migration[7.2]
  def change
    create_table :bank_holidays do |t|
      t.date :date, null: false, index: { unique: true }
      t.string :name, null: false

      t.timestamps
    end
  end
end
