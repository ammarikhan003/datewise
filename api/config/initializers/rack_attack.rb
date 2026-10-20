# Limits order attempts per IP. Rack::Attack has its own in-memory store:
# Rails.cache is a no-op store in development and test, which would quietly
# switch the limit off.
Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

Rack::Attack.throttle("orders/ip", limit: 10, period: 1.minute) do |request|
  request.ip if request.post? && request.path == "/api/orders"
end

Rack::Attack.throttled_responder = lambda do |request|
  retry_after = request.env["rack.attack.match_data"][:period].to_s
  [ 429, { "content-type" => "application/json", "retry-after" => retry_after }, [ { error: "rate_limited" }.to_json ] ]
end
