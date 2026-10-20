module Imports
  Rejection = Data.define(:line, :reason)

  # What an import did: rows saved, rows skipped as duplicates, and rows
  # rejected with the line number (header is line 1) and reason.
  Result = Data.define(:imported, :duplicates, :rejected) do
    def report
      summary = "#{imported} imported, #{duplicates} duplicates, #{rejected.size} rejected"
      [ summary, *rejected.map { |r| "  line #{r.line}: #{r.reason}" } ].join("\n")
    end
  end
end
