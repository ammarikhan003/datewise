require "rails_helper"

# Requests run at Tuesday 10 November 2026, 10:00 London time.
RSpec.describe "Admin days API", type: :request do
  before do
    travel_to Time.utc(2026, 11, 10, 10, 0)
    allow(Rails.configuration.x).to receive(:admin_token).and_return("s3cret")
  end

  let(:auth) { { "Authorization" => "Bearer s3cret" } }
  let(:json) { response.parsed_body }

  describe "authentication" do
    it "refuses a request without a token" do
      get "/api/admin/days"

      expect(response).to have_http_status(:unauthorized)
      expect(json).to eq("error" => "unauthorized")
    end

    it "refuses the wrong token" do
      get "/api/admin/days", headers: { "Authorization" => "Bearer guess" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "refuses everyone when no admin token is configured" do
      allow(Rails.configuration.x).to receive(:admin_token).and_return(nil)

      get "/api/admin/days", headers: { "Authorization" => "Bearer " }

      expect(response).to have_http_status(:unauthorized)
    end

    it "guards PATCH too" do
      patch "/api/admin/days/2026-11-12", params: { day: { closed: true } }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(DeliveryDay.count).to eq(0)
    end
  end

  describe "GET /api/admin/days" do
    it "defaults to today through 30 days ahead" do
      get "/api/admin/days", headers: auth

      expect(response).to have_http_status(:ok)
      expect(json.size).to eq(31)
      expect(json.first["date"]).to eq("2026-11-10")
      expect(json.last["date"]).to eq("2026-12-10")
    end

    it "shows bookings against capacity, closures and bank holidays" do
      create(:delivery_day, date: Date.new(2026, 11, 12), capacity: 20)
      create(:delivery_day, date: Date.new(2026, 11, 13), closed: true, closed_reason: "Van service")
      create(:bank_holiday, date: Date.new(2026, 11, 14), name: "Test holiday")
      create_list(:order, 3, delivery_date: Date.new(2026, 11, 12))

      get "/api/admin/days", params: { from: "2026-11-11", to: "2026-11-14" }, headers: auth

      expect(json).to eq([
        { "date" => "2026-11-11", "capacity" => 50, "booked" => 0, "closed" => false, "closed_reason" => nil, "bank_holiday" => nil },
        { "date" => "2026-11-12", "capacity" => 20, "booked" => 3, "closed" => false, "closed_reason" => nil, "bank_holiday" => nil },
        { "date" => "2026-11-13", "capacity" => 50, "booked" => 0, "closed" => true, "closed_reason" => "Van service", "bank_holiday" => nil },
        { "date" => "2026-11-14", "capacity" => 50, "booked" => 0, "closed" => false, "closed_reason" => nil, "bank_holiday" => "Test holiday" }
      ])
    end

    it "returns 400 for a bad range" do
      get "/api/admin/days", params: { from: "2026-11-20", to: "2026-11-11" }, headers: auth

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "PATCH /api/admin/days/:date" do
    def update_day(date, attributes)
      patch "/api/admin/days/#{date}", params: { day: attributes }, headers: auth, as: :json
    end

    it "closes a day that has no row yet, and customers then see it closed" do
      update_day("2026-11-12", closed: true, closed_reason: "Van service")

      expect(response).to have_http_status(:ok)
      expect(json).to include("date" => "2026-11-12", "closed" => true, "closed_reason" => "Van service", "capacity" => 50)

      create(:product, slug: "tulips")
      get "/api/products/tulips/availability", params: { from: "2026-11-12", to: "2026-11-12" }
      expect(response.parsed_body["dates"].first["reason"]).to eq("closed")
    end

    it "reopens a day and clears its reason" do
      create(:delivery_day, date: Date.new(2026, 11, 12), closed: true, closed_reason: "Van service")

      update_day("2026-11-12", closed: false)

      expect(json).to include("closed" => false, "closed_reason" => nil)
    end

    it "changes capacity, even below the number already booked" do
      create_list(:order, 3, delivery_date: Date.new(2026, 11, 12))

      update_day("2026-11-12", capacity: 2)

      expect(json).to include("capacity" => 2, "booked" => 3)
    end

    it "includes the bank holiday name when editing a bank holiday" do
      create(:bank_holiday, date: Date.new(2026, 12, 28), name: "Boxing Day (substitute day)")

      update_day("2026-12-28", capacity: 10)

      expect(json).to include("capacity" => 10, "bank_holiday" => "Boxing Day (substitute day)")
    end

    it "returns 422 for an invalid capacity and saves nothing" do
      update_day("2026-11-12", capacity: -1)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json).to include("error" => "invalid", "details" => { "capacity" => [ "must be greater than or equal to 0" ] })
      expect(DeliveryDay.count).to eq(0)
    end

    it "returns 400 for a malformed date" do
      update_day("12-11-2026", closed: true)

      expect(response).to have_http_status(:bad_request)
    end

    it "returns 400 when the day is missing" do
      patch "/api/admin/days/2026-11-12", params: {}, headers: auth, as: :json

      expect(response).to have_http_status(:bad_request)
    end
  end
end
