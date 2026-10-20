FactoryBot.define do
  factory :bank_holiday do
    sequence(:date) { |n| Date.new(2027, 1, 1) + n }
    name { "Bank holiday" }
  end
end
