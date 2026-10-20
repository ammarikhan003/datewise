require "rails_helper"

# These specs book from several threads at once, each on its own database
# connection, so they can't run inside the usual rolled-back test
# transaction: the threads must see each other's commits. They clean up
# after themselves instead.
RSpec.describe OrderBooking, "under concurrent bookings" do
  self.use_transactional_tests = false

  let(:now) { Time.utc(2026, 11, 10, 10, 0) }
  let(:customer) { { customer_name: "Ada Lovelace", email: "ada@example.com", address: "1 Test Street" } }
  let(:threads) { 8 }

  after do
    Order.delete_all
    DeliveryDay.delete_all
    Product.delete_all
  end

  # Starts every booking at the same moment and returns their results.
  def book_all_at_once(bookings)
    start = Queue.new
    workers = bookings.map do |booking|
      Thread.new do
        start.pop
        ActiveRecord::Base.connection_pool.with_connection do
          described_class.call(now:, **customer, **booking)
        end
      end
    end
    bookings.size.times { start << :go }

    ActiveSupport::Dependencies.interlock.permit_concurrent_loads { workers.map(&:value) }
  end

  it "lets exactly one of many customers take the last slot on a date" do
    date = Date.new(2026, 11, 12)
    DeliveryDay.create!(date:, capacity: 1)
    products = create_list(:product, threads, stock: 5)

    results = book_all_at_once(products.map { |product| { product:, delivery_date: date } })

    expect(results.count(&:success?)).to eq(1)
    expect(results.reject(&:success?).map(&:reason)).to all(eq(:fully_booked))
    expect(Order.where(delivery_date: date).count).to eq(1)
  end

  it "lets exactly one of many customers take the last item of stock" do
    product = create(:product, stock: 1)
    dates = (0...threads).map { |i| Date.new(2026, 11, 12) + (i % 2) }

    # Each thread gets its own copy of the product, as separate requests would.
    results = book_all_at_once(dates.map { |delivery_date| { product: Product.find(product.id), delivery_date: } })

    expect(results.count(&:success?)).to eq(1)
    expect(results.reject(&:success?).map(&:reason)).to all(eq(:out_of_stock))
    expect(product.reload.stock).to eq(0)
  end
end
