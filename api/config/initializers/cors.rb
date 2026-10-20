# Only the Angular app may call the API from a browser.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("WEB_ORIGIN", "http://localhost:4200")

    resource "/api/*",
      headers: :any,
      methods: %i[get post patch options head]
  end
end
