require "rails_helper"

# "Now" is Tuesday 10 November 2026 at 10:00 London time, so Thursday the
# 12th passes every availability rule unless a test changes something.
RSpec.describe OrderBooking do
  let(:now) { Time.utc(2026, 11, 10, 10, 0) }
  let(:date) { Date.new(2026, 11, 12) }
  let(:product) { create(:product, stock: 3) }
  let(:customer) { { customer_name: "Ada Lovelace", email: "ada@example.com", address: "1 Test Street" } }

  def book(delivery_date: date, product: self.product, now: self.now, **overrides)
    described_class.call(product:, delivery_date:, now:, **customer, **overrides)
  end

  it "saves the order and takes one off stock" do
    result = book

    expect(result).to be_success
    expect(result.order).to be_persisted
    expect(result.order).to have_attributes(product:, delivery_date: date, email: "ada@example.com", status: "confirmed")
    expect(product.reload.stock).to eq(2)
  end

  it "refuses a date that fails a rule, returning the reason and saving nothing" do
    create(:delivery_day, date:, capacity: 1)
    create(:order, delivery_date: date)

    result = book

    expect(result).not_to be_success
    expect(result.reason).to eq(:fully_booked)
    expect(Order.where(product:)).to be_empty
    expect(product.reload.stock).to eq(3)
  end

  it "leaves no delivery_days row behind when it refuses a date" do
    result = book(delivery_date: Date.new(2026, 11, 15))

    expect(result.reason).to eq(:closed)
    expect(DeliveryDay.where(date: Date.new(2026, 11, 15))).not_to exist
  end

  it "checks the rules against the time it is given" do
    result = book(delivery_date: Date.new(2026, 11, 11), now: Time.utc(2026, 11, 10, 14, 0))

    expect(result.reason).to eq(:after_cutoff)
  end

  it "refuses the last item once it has gone" do
    book
    book
    book

    expect(book.reason).to eq(:out_of_stock)
    expect(product.reload.stock).to eq(0)
  end

  it "returns field errors without locking or saving anything" do
    result = book(email: "not-an-email", address: "")

    expect(result).not_to be_success
    expect(result.reason).to be_nil
    expect(result.errors.to_hash).to include(email: [ "is invalid" ], address: [ "can't be blank" ])
    expect(Order.count).to eq(0)
    expect(DeliveryDay.count).to eq(0)
  end

  it "returns a field error when the delivery date is missing" do
    result = book(delivery_date: nil)

    expect(result.errors.to_hash).to include(delivery_date: [ "can't be blank" ])
  end
end
