module Imports
  # What an import did: rows saved, rows skipped as duplicates, and the
  # rejected rows (see Rejection).
  Result = Data.define(:imported, :duplicates, :rejected) do
    def report
      summary = "#{imported} imported, #{duplicates} duplicates, #{rejected.size} rejected"
      [ summary, *rejected.map { |r| "  line #{r.line}: #{r.reason}" } ].join("\n")
    end
  end
end
