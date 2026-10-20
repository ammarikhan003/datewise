module Imports
  # Columns: date (YYYY-MM-DD), name. A date that already exists is skipped.
  class BankHolidayImporter < CsvImporter
    private

    def model = BankHoliday
    def unique_by = :date
    def required_columns = %w[date name]

    def attributes_for(row)
      { date: strict_date(row["date"]), name: row["name"] }
    end

    def strict_date(value)
      raise Date::Error unless value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

      Date.strptime(value, "%Y-%m-%d")
    rescue Date::Error
      raise InvalidRow, %(date is not a real YYYY-MM-DD date (got "#{value}"))
    end
  end
end
