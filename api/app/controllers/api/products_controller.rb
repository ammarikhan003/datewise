module Api
  class ProductsController < ApplicationController
    include DateParams

    def index
      render json: Product.order(:name).map { |product| ProductSerializer.call(product) }
    end

    def show
      render json: ProductSerializer.call(product)
    end

    # Each date from..to with whether it can be booked and, if not, why.
    # Defaults to tomorrow through the end of the 30-day booking window.
    def availability
      today = Date.current
      from, to = date_range_params(
        default_from: today + 1,
        default_to: today + AvailabilityCalculator::BOOKING_WINDOW_DAYS
      )
      results = AvailabilityCalculator.load(product, from:, to:, now: Time.current).range(from, to)

      render json: {
        product: product.slug,
        from:,
        to:,
        dates: results.map { |result| { date: result.date, available: result.available?, reason: result.reason } }
      }
    end

    private

    def product
      @product ||= Product.find_by!(slug: params[:slug])
    end
  end
end
