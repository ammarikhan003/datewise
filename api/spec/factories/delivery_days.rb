FactoryBot.define do
  factory :delivery_day do
    sequence(:date) { |n| Date.new(2026, 11, 1) + n }
  end
end
