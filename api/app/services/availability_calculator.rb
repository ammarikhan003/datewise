# Decides whether a product can be delivered on a date, and if not, why.
# The eight rules are in docs/SPEC.md; they run in that order and the first
# one that fails is the reason returned.
#
# This class never reads the clock or the database. The caller passes in
# `now` and the data for the dates being checked (see .load for the
# database version), so every rule can be tested with plain values.
class AvailabilityCalculator
  TIME_ZONE = "Europe/London".freeze
  CUTOFF_HOUR = 14
  BOOKING_WINDOW_DAYS = 30
  DEFAULT_CAPACITY = 50

  Result = Data.define(:date, :reason) do
    def available? = reason.nil?
  end

  # Builds a calculator with everything it needs for dates from..to.
  # Checking a date outside that range would use incomplete data.
  def self.load(product, from:, to:, now:)
    dates = from..to
    delivery_days = DeliveryDay.where(date: dates).to_a

    new(
      product:,
      now:,
      bank_holidays: BankHoliday.where(date: dates).pluck(:date),
      closed_dates: delivery_days.select(&:closed).map(&:date),
      capacities: delivery_days.to_h { |day| [ day.date, day.capacity ] },
      booked_counts: Order.where(delivery_date: dates, status: "confirmed").group(:delivery_date).count
    )
  end

  def initialize(product:, now:, bank_holidays: [], closed_dates: [], capacities: {}, booked_counts: {})
    @product = product
    @now = now.in_time_zone(TIME_ZONE)
    @today = @now.to_date
    @bank_holidays = bank_holidays.to_set
    @closed_dates = closed_dates.to_set
    @capacities = capacities
    @booked_counts = booked_counts
  end

  def check(date)
    Result.new(date:, reason: first_failing_rule(date))
  end

  def range(from, to)
    (from..to).map { |date| check(date) }
  end

  private

  def first_failing_rule(date)
    return :past if date <= @today
    return :after_cutoff if date < earliest_date
    return :closed if date.sunday? || @bank_holidays.include?(date)
    return :closed if @closed_dates.include?(date)
    return :fully_booked if booked(date) >= capacity(date)
    return :lead_time if date < earliest_date + @product.lead_time_days
    return :out_of_stock if @product.stock <= 0
    :too_far if date > @today + BOOKING_WINDOW_DAYS
  end

  # Tomorrow until 14:00 London time, the day after tomorrow from then on.
  def earliest_date
    @now.hour < CUTOFF_HOUR ? @today + 1 : @today + 2
  end

  def capacity(date) = @capacities.fetch(date, DEFAULT_CAPACITY)
  def booked(date) = @booked_counts.fetch(date, 0)
end
