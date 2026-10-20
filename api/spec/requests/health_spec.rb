require "rails_helper"

# Placeholder so CI has something real to run until milestone 2 adds models.
RSpec.describe "Health check", type: :request do
  it "returns 200 from /up" do
    get "/up"

    expect(response).to have_http_status(:ok)
  end
end
