# Loads the sample products and England and Wales bank holidays.
# Safe to re-run: existing slugs and dates are skipped as duplicates.
# products.csv deliberately contains two bad rows to show the rejection report.
{
  "products.csv" => Imports::ProductImporter,
  "bank_holidays.csv" => Imports::BankHolidayImporter
}.each do |file, importer|
  result = File.open(Rails.root.join("db/seeds", file)) { |io| importer.new(io).call }
  puts "#{file}: #{result.report}"
end
