module Api
  module Admin
    class BaseController < ApplicationController
      before_action :require_admin_token

      private

      def require_admin_token
        expected = Rails.configuration.x.admin_token
        given = request.authorization.to_s.delete_prefix("Bearer ")
        return if expected.present? && ActiveSupport::SecurityUtils.secure_compare(given, expected)

        render json: { error: "unauthorized" }, status: :unauthorized
      end
    end
  end
end
