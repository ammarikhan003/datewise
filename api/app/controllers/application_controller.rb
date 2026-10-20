class ApplicationController < ActionController::API
  class BadRequest < StandardError; end

  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "not_found" }, status: :not_found
  end

  rescue_from BadRequest, ActionController::ParameterMissing do |error|
    render json: { error: "bad_request", message: error.message }, status: :bad_request
  end
end
