namespace :datewise do
  run_import = lambda do |importer, path|
    abort "Usage: give the CSV path in brackets, e.g. datewise:import[file.csv]" if path.blank?
    abort "File not found: #{path}" unless File.exist?(path)

    result = File.open(path) { |file| importer.new(file).call }
    puts result.report
  end

  desc "Import products from a CSV file, e.g. bin/rails \"datewise:import[db/seeds/products.csv]\""
  task :import, [ :path ] => :environment do |_task, args|
    run_import.call(Imports::ProductImporter, args[:path])
  end

  desc "Import bank holidays from a CSV file, e.g. bin/rails \"datewise:import_holidays[db/seeds/bank_holidays.csv]\""
  task :import_holidays, [ :path ] => :environment do |_task, args|
    run_import.call(Imports::BankHolidayImporter, args[:path])
  end
end
