require "rails_helper"

RSpec.describe AvailabilityCalculator, ".load" do
  let(:now) { Time.utc(2026, 11, 10, 10, 0) }
  let(:product) { create(:product) }
  let(:from) { Date.new(2026, 11, 11) }
  let(:to) { Date.new(2026, 11, 14) }

  def reasons
    described_class.load(product, from:, to:, now:).range(from, to).to_h { |r| [ r.date.day, r.reason ] }
  end

  it "reads bank holidays, closed days, capacities and orders for the range" do
    create(:bank_holiday, date: Date.new(2026, 11, 11))
    create(:delivery_day, date: Date.new(2026, 11, 12), closed: true, closed_reason: "Van service")
    create(:delivery_day, date: Date.new(2026, 11, 13), capacity: 2)
    create_list(:order, 2, delivery_date: Date.new(2026, 11, 13))

    expect(reasons).to eq(11 => :closed, 12 => :closed, 13 => :fully_booked, 14 => nil)
  end

  it "counts orders for every product against a day's capacity" do
    create(:delivery_day, date: Date.new(2026, 11, 13), capacity: 1)
    create(:order, delivery_date: Date.new(2026, 11, 13), product: create(:product))

    expect(reasons[13]).to eq(:fully_booked)
  end

  it "uses the default capacity for days without a delivery_days row" do
    create(:order, delivery_date: Date.new(2026, 11, 13))

    expect(reasons[13]).to be_nil
  end
end
