# Strict YYYY-MM-DD parsing for query and path params. Anything else is a
# 400, never a silently guessed date.
module DateParams
  MAX_RANGE_DAYS = 62

  private

  def date_param(name, value = params[name])
    raise ApplicationController::BadRequest, "#{name} must be a date in YYYY-MM-DD format" unless value.to_s.match?(/\A\d{4}-\d{2}-\d{2}\z/)

    Date.strptime(value, "%Y-%m-%d")
  rescue Date::Error
    raise ApplicationController::BadRequest, "#{name} is not a real date"
  end

  # from/to from the query string, falling back to the given defaults.
  def date_range_params(default_from:, default_to:)
    from = params[:from].present? ? date_param(:from) : default_from
    to = params[:to].present? ? date_param(:to) : default_to
    raise ApplicationController::BadRequest, "from must be on or before to" if from > to
    raise ApplicationController::BadRequest, "range can be at most #{MAX_RANGE_DAYS} days" if (to - from).to_i + 1 > MAX_RANGE_DAYS

    [ from, to ]
  end
end
