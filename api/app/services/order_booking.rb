# Places an order only if its delivery date is still available at the
# moment of saving.
#
# The availability check and the insert happen in one transaction that
# holds two row locks, always taken in this order to avoid deadlocks:
#
# 1. The date's delivery_days row (created if missing). Every booking for
#    that date waits here, so two customers can't both see "1 slot left".
# 2. The product row, so two bookings can't both take the last item.
#
# If any availability rule fails, the transaction rolls back and nothing
# is saved, including a delivery_days row created in step 1.
class OrderBooking
  Result = Data.define(:order, :reason, :errors) do
    def success? = !order.nil?
  end

  def self.call(...) = new(...).call

  def initialize(product:, delivery_date:, now:, customer_name:, email:, address:)
    @product = product
    @delivery_date = delivery_date
    @now = now
    @order = Order.new(product:, delivery_date:, customer_name:, email:, address:)
  end

  def call
    return Result.new(order: nil, reason: nil, errors: @order.errors) unless @order.valid?

    reason = nil
    ActiveRecord::Base.transaction do
      lock_delivery_day
      # A fresh, locked copy: the stock we check is the stock we decrement,
      # whatever state the caller's object is in.
      product = Product.lock.find(@product.id)

      reason = availability_reason(product)
      raise ActiveRecord::Rollback if reason

      @order.product = product
      @order.save!
      product.update!(stock: product.stock - 1)
    end

    return Result.new(order: nil, reason:, errors: nil) if reason

    Result.new(order: @order, reason: nil, errors: nil)
  end

  private

  # INSERT ... ON CONFLICT DO NOTHING, then SELECT ... FOR UPDATE. Unlike
  # create_or_find_by!, this skips the model's uniqueness validation, which
  # would raise when another booking has just created the same row.
  def lock_delivery_day
    DeliveryDay.insert_all([ { date: @delivery_date } ], unique_by: :date)
    DeliveryDay.lock.find_by!(date: @delivery_date)
  end

  def availability_reason(product)
    AvailabilityCalculator
      .load(product, from: @delivery_date, to: @delivery_date, now: @now)
      .check(@delivery_date)
      .reason
  end
end
