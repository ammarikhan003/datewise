require "rails_helper"

RSpec.describe DeliveryDay do
  it "is valid from the factory" do
    expect(build(:delivery_day)).to be_valid
  end

  it "defaults to a capacity of 50 and open" do
    day = DeliveryDay.new

    expect(day.capacity).to eq(50)
    expect(day.closed).to be(false)
  end

  it "requires a date" do
    expect(build(:delivery_day, date: nil)).not_to be_valid
  end

  it "allows only one row per date" do
    create(:delivery_day, date: Date.new(2026, 12, 1))

    expect(build(:delivery_day, date: Date.new(2026, 12, 1))).not_to be_valid
  end

  it "only accepts a whole number of zero or more for capacity" do
    expect(build(:delivery_day, capacity: 0)).to be_valid
    expect(build(:delivery_day, capacity: -1)).not_to be_valid
    expect(build(:delivery_day, capacity: 2.5)).not_to be_valid
  end

  it "rejects a negative capacity at the database level too" do
    day = create(:delivery_day)

    expect { day.update_column(:capacity, -1) }
      .to raise_error(ActiveRecord::StatementInvalid, /check/i)
  end

  it "clears the closed reason when a day is reopened" do
    day = create(:delivery_day, closed: true, closed_reason: "Van service")

    day.update!(closed: false)

    expect(day.reload.closed_reason).to be_nil
  end
end
