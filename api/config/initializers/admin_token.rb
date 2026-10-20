# Admin endpoints accept `Authorization: Bearer <ADMIN_TOKEN>`. When the
# variable is unset, every admin request is refused.
Rails.configuration.x.admin_token = ENV["ADMIN_TOKEN"].presence
