require "rails_helper"

# Requests run at Tuesday 10 November 2026, 10:00 London time.
RSpec.describe "Products API", type: :request do
  before { travel_to Time.utc(2026, 11, 10, 10, 0) }

  let(:json) { response.parsed_body }

  describe "GET /api/products" do
    it "lists products by name" do
      create(:product, name: "Tulips", slug: "tulips", price_pence: 2800, lead_time_days: 0, stock: 4)
      create(:product, name: "Engraved Mug", slug: "engraved-mug", price_pence: 1800, lead_time_days: 2, stock: 0)

      get "/api/products"

      expect(response).to have_http_status(:ok)
      expect(json.pluck("slug")).to eq(%w[engraved-mug tulips])
      expect(json.first).to eq(
        "slug" => "engraved-mug", "name" => "Engraved Mug", "price_pence" => 1800,
        "lead_time_days" => 2, "in_stock" => false, "image_url" => nil
      )
    end
  end

  describe "GET /api/products/:slug" do
    it "returns the product" do
      create(:product, slug: "tulips", name: "Tulips")

      get "/api/products/tulips"

      expect(response).to have_http_status(:ok)
      expect(json).to include("slug" => "tulips", "name" => "Tulips", "in_stock" => true)
    end

    it "returns 404 for an unknown slug" do
      get "/api/products/nope"

      expect(response).to have_http_status(:not_found)
      expect(json).to eq("error" => "not_found")
    end
  end

  describe "GET /api/products/:slug/availability" do
    let!(:product) { create(:product, slug: "tulips") }

    it "defaults to tomorrow through 30 days ahead" do
      get "/api/products/tulips/availability"

      expect(response).to have_http_status(:ok)
      expect(json).to include("product" => "tulips", "from" => "2026-11-11", "to" => "2026-12-10")
      expect(json["dates"].size).to eq(30)
      expect(json["dates"].first).to eq("date" => "2026-11-11", "available" => true, "reason" => nil)
    end

    it "returns a reason for each unavailable date, using the database" do
      create(:bank_holiday, date: Date.new(2026, 11, 12))

      get "/api/products/tulips/availability", params: { from: "2026-11-10", to: "2026-11-15" }

      expect(json["dates"].map { |d| [ d["date"], d["reason"] ] }).to eq([
        [ "2026-11-10", "past" ], [ "2026-11-11", nil ], [ "2026-11-12", "closed" ],
        [ "2026-11-13", nil ], [ "2026-11-14", nil ], [ "2026-11-15", "closed" ]
      ])
    end

    it "uses London time for the cutoff" do
      travel_to Time.utc(2026, 11, 10, 14, 0)

      get "/api/products/tulips/availability", params: { from: "2026-11-11", to: "2026-11-11" }

      expect(json["dates"].first["reason"]).to eq("after_cutoff")
    end

    {
      "a date that doesn't exist" => { from: "2026-02-30", to: "2026-03-01" },
      "a date in the wrong format" => { from: "11/11/2026", to: "2026-11-12" },
      "from after to" => { from: "2026-11-20", to: "2026-11-12" },
      "more than 62 days" => { from: "2026-11-11", to: "2027-01-12" }
    }.each do |description, params|
      it "returns 400 for #{description}" do
        get "/api/products/tulips/availability", params: params

        expect(response).to have_http_status(:bad_request)
        expect(json["error"]).to eq("bad_request")
        expect(json["message"]).to be_present
      end
    end

    it "allows exactly 62 days" do
      get "/api/products/tulips/availability", params: { from: "2026-11-11", to: "2027-01-11" }

      expect(json["dates"].size).to eq(62)
    end

    it "returns 404 for an unknown product" do
      get "/api/products/nope/availability"

      expect(response).to have_http_status(:not_found)
    end
  end
end
