FactoryBot.define do
  factory :order do
    product
    delivery_date { Date.new(2026, 11, 20) }
    customer_name { "Ada Lovelace" }
    email { "ada@example.com" }
    address { "1 Test Street, London, N1 1AA" }
  end
end
