module Imports
  # A CSV row that wasn't imported: its line number (header is line 1) and why.
  Rejection = Data.define(:line, :reason)
end
