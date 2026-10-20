module Api
  class OrdersController < ApplicationController
    include DateParams

    def create
      result = OrderBooking.call(
        product: Product.find_by!(slug: order_params.require(:product_slug)),
        delivery_date:,
        now: Time.current,
        customer_name: order_params[:customer_name],
        email: order_params[:email],
        address: order_params[:address]
      )

      if result.success?
        render json: OrderSerializer.call(result.order), status: :created
      elsif result.reason
        render json: { error: "unavailable", reason: result.reason }, status: :unprocessable_entity
      else
        render json: { error: "invalid", details: result.errors.to_hash }, status: :unprocessable_entity
      end
    end

    private

    def order_params
      @order_params ||= params.require(:order).permit(:product_slug, :delivery_date, :customer_name, :email, :address)
    end

    # Blank is left to the model ("can't be blank"); malformed is a 400.
    def delivery_date
      value = order_params[:delivery_date]
      date_param(:delivery_date, value) if value.present?
    end
  end
end
