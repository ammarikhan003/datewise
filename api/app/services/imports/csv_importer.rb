require "csv"

module Imports
  # Shared row loop for CSV imports. Subclasses say which model to build,
  # which columns are required, how to turn a row into attributes, and which
  # attribute identifies a duplicate. Good rows are saved even when others fail.
  class CsvImporter
    # Raised by #attributes_for when a value can't be parsed.
    class InvalidRow < StandardError; end

    def initialize(io)
      @io = io
    end

    def call
      imported = 0
      duplicates = 0
      rejected = []
      seen = Set.new

      csv = CSV.new(@io, headers: true, skip_blanks: true, strip: true)
      csv.each do |row|
        line = csv.lineno
        next if row.fields.all?(&:blank?)

        missing = required_columns.select { |column| row[column].blank? }
        if missing.any?
          rejected << Rejection.new(line:, reason: "missing #{missing.join(', ')}")
          next
        end

        attributes = attributes_for(row)
        key = attributes.fetch(unique_by)
        if seen.include?(key) || model.exists?(unique_by => key)
          duplicates += 1
          next
        end

        record = model.new(attributes)
        if record.save
          imported += 1
          seen << key
        else
          rejected << Rejection.new(line:, reason: record.errors.full_messages.join(", "))
        end
      rescue InvalidRow => e
        rejected << Rejection.new(line:, reason: e.message)
      end

      Result.new(imported:, duplicates:, rejected:)
    end

    private

    def whole_number(row, column, default: nil)
      value = row[column]
      return default if value.blank?
      raise InvalidRow, %(#{column} is not a whole number (got "#{value}")) unless value.match?(/\A-?\d+\z/)

      value.to_i
    end
  end
end
