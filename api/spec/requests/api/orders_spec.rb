require "rails_helper"

# Requests run at Tuesday 10 November 2026, 10:00 London time.
RSpec.describe "POST /api/orders", type: :request do
  before { travel_to Time.utc(2026, 11, 10, 10, 0) }

  let!(:product) { create(:product, slug: "tulips", name: "Tulips", stock: 5) }
  let(:order_params) do
    {
      product_slug: "tulips", delivery_date: "2026-11-12",
      customer_name: "Ada Lovelace", email: "ada@example.com", address: "1 Test Street, London"
    }
  end
  let(:json) { response.parsed_body }

  def place(overrides = {})
    post "/api/orders", params: { order: order_params.merge(overrides) }, as: :json
  end

  it "creates the order and returns it" do
    place

    expect(response).to have_http_status(:created)
    expect(json).to include(
      "id" => Order.last.id, "delivery_date" => "2026-11-12", "status" => "confirmed",
      "customer_name" => "Ada Lovelace", "email" => "ada@example.com", "address" => "1 Test Street, London",
      "product" => { "slug" => "tulips", "name" => "Tulips", "price_pence" => product.price_pence }
    )
    expect(product.reload.stock).to eq(4)
  end

  it "ignores fields the customer may not set" do
    place(status: "cancelled", id: 999)

    expect(Order.last).to have_attributes(status: "confirmed")
    expect(Order.last.id).not_to eq(999)
  end

  it "returns 422 with the reason when the date is unavailable" do
    place(delivery_date: "2026-11-15")

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json).to eq("error" => "unavailable", "reason" => "closed")
    expect(Order.count).to eq(0)
  end

  it "returns 422 when the last slot has gone" do
    create(:delivery_day, date: Date.new(2026, 11, 12), capacity: 1)
    create(:order, delivery_date: Date.new(2026, 11, 12))

    place

    expect(json).to eq("error" => "unavailable", "reason" => "fully_booked")
  end

  it "returns 422 with field errors" do
    place(email: "nope", customer_name: "", delivery_date: "")

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json["error"]).to eq("invalid")
    expect(json["details"]).to include(
      "email" => [ "is invalid" ], "customer_name" => [ "can't be blank" ], "delivery_date" => [ "can't be blank" ]
    )
  end

  it "returns 422, not 500, when a field is left out entirely" do
    post "/api/orders", params: { order: order_params.except(:address) }, as: :json

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json["details"]).to include("address" => [ "can't be blank" ])
  end

  it "returns 404 for an unknown product" do
    place(product_slug: "nope")

    expect(response).to have_http_status(:not_found)
  end

  it "returns 400 for a malformed date" do
    place(delivery_date: "12/11/2026")

    expect(response).to have_http_status(:bad_request)
  end

  it "returns 400 when the order is missing" do
    post "/api/orders", params: {}, as: :json

    expect(response).to have_http_status(:bad_request)
  end
end
