module Api
  module Admin
    class DaysController < BaseController
      include DateParams

      # Each day from..to (default: today through 30 days ahead) with
      # orders booked against capacity, closures and bank holidays.
      def index
        today = Date.current
        from, to = date_range_params(default_from: today, default_to: today + AvailabilityCalculator::BOOKING_WINDOW_DAYS)
        dates = from..to
        days = DeliveryDay.where(date: dates).index_by(&:date)
        holidays = BankHoliday.where(date: dates).pluck(:date, :name).to_h
        booked = booked_counts(dates)

        render json: dates.map { |date| day_json(date, days[date], booked.fetch(date, 0), holidays[date]) }
      end

      # Closes or reopens a day, or changes its capacity. Creates the day's
      # row if needed, using the same insert-then-lock as OrderBooking so it
      # can't race a booking; nothing is kept if validation fails.
      def update
        date = date_param(:date)
        day = nil

        DeliveryDay.transaction do
          DeliveryDay.insert_all([ { date: } ], unique_by: :date)
          day = DeliveryDay.lock.find_by!(date:)
          raise ActiveRecord::Rollback unless day.update(day_params)
        end

        if day.errors.any?
          render json: { error: "invalid", details: day.errors.to_hash }, status: :unprocessable_entity
        else
          render json: day_json(date, day, booked_counts(date..date).fetch(date, 0), BankHoliday.find_by(date:)&.name)
        end
      end

      private

      def day_params
        params.require(:day).permit(:closed, :closed_reason, :capacity)
      end

      def booked_counts(dates)
        Order.where(delivery_date: dates, status: "confirmed").group(:delivery_date).count
      end

      def day_json(date, day, booked, bank_holiday)
        {
          date:,
          capacity: day&.capacity || AvailabilityCalculator::DEFAULT_CAPACITY,
          booked:,
          closed: day&.closed || false,
          closed_reason: day&.closed_reason,
          bank_holiday:
        }
      end
    end
  end
end
