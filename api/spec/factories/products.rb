FactoryBot.define do
  factory :product do
    sequence(:name) { |n| "Product #{n}" }
    sequence(:slug) { |n| "product-#{n}" }
    price_pence { 2_500 }
    lead_time_days { 0 }
    stock { 10 }
  end
end
