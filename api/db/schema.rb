# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_10_20_120300) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "bank_holidays", force: :cascade do |t|
    t.date "date", null: false
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_bank_holidays_on_date", unique: true
  end

  create_table "delivery_days", force: :cascade do |t|
    t.date "date", null: false
    t.integer "capacity", default: 50, null: false
    t.boolean "closed", default: false, null: false
    t.string "closed_reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_delivery_days_on_date", unique: true
    t.check_constraint "capacity >= 0", name: "delivery_days_capacity_non_negative"
  end

  create_table "orders", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.date "delivery_date", null: false
    t.string "customer_name", null: false
    t.string "email", null: false
    t.text "address", null: false
    t.string "status", default: "confirmed", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["delivery_date"], name: "index_orders_on_delivery_date"
    t.index ["product_id"], name: "index_orders_on_product_id"
  end

  create_table "products", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.integer "price_pence", null: false
    t.integer "lead_time_days", default: 0, null: false
    t.integer "stock", default: 0, null: false
    t.string "image_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_products_on_slug", unique: true
    t.check_constraint "lead_time_days >= 0", name: "products_lead_time_days_non_negative"
    t.check_constraint "price_pence >= 0", name: "products_price_pence_non_negative"
    t.check_constraint "stock >= 0", name: "products_stock_non_negative"
  end

  add_foreign_key "orders", "products"
end
