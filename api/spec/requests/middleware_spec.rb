require "rails_helper"

RSpec.describe "Middleware", type: :request do
  describe "CORS" do
    it "allows the Angular app's origin" do
      get "/api/products", headers: { "Origin" => "http://localhost:4200" }

      expect(response.headers["Access-Control-Allow-Origin"]).to eq("http://localhost:4200")
    end

    it "answers the browser's preflight for an admin PATCH" do
      options "/api/admin/days/2026-11-12", headers: {
        "Origin" => "http://localhost:4200",
        "Access-Control-Request-Method" => "PATCH",
        "Access-Control-Request-Headers" => "authorization, content-type"
      }

      expect(response.headers["Access-Control-Allow-Origin"]).to eq("http://localhost:4200")
      expect(response.headers["Access-Control-Allow-Methods"]).to include("PATCH")
    end

    it "does not allow other origins" do
      get "/api/products", headers: { "Origin" => "https://evil.example" }

      expect(response.headers["Access-Control-Allow-Origin"]).to be_nil
    end
  end

  describe "rate limiting POST /api/orders" do
    def post_order = post("/api/orders", params: { order: { product_slug: "nope" } }, as: :json)

    it "allows 10 orders a minute per IP, then returns 429" do
      10.times { post_order }
      expect(response).to have_http_status(:not_found)

      post_order

      expect(response).to have_http_status(:too_many_requests)
      expect(response.parsed_body).to eq("error" => "rate_limited")
      expect(response.headers["Retry-After"]).to be_present
    end

    it "does not limit reads" do
      11.times { get "/api/products" }

      expect(response).to have_http_status(:ok)
    end
  end
end
