require "rails_helper"
require "rake"

RSpec.describe "datewise rake tasks" do
  before(:all) { Rails.application.load_tasks if Rake::Task.tasks.empty? }

  def invoke(task_name, path)
    task = Rake::Task[task_name]
    task.reenable
    task.invoke(path)
  end

  def csv_file(contents)
    Tempfile.new([ "import", ".csv" ]).tap do |file|
      file.write(contents)
      file.close
    end
  end

  it "imports products and prints a summary with each rejected row" do
    file = csv_file(<<~CSV)
      name,slug,price_pence,lead_time_days,stock,image_url
      Tulips,tulips,2000,0,8,
      Lilies,lilies,cheap,0,8,
    CSV

    expect { invoke("datewise:import", file.path) }.to output(<<~OUT).to_stdout
      1 imported, 0 duplicates, 1 rejected
        line 3: price_pence is not a whole number (got "cheap")
    OUT
    expect(Product.pluck(:slug)).to eq([ "tulips" ])
  end

  it "imports bank holidays" do
    file = csv_file("date,name\n2026-12-25,Christmas Day\n")

    expect { invoke("datewise:import_holidays", file.path) }
      .to output("1 imported, 0 duplicates, 0 rejected\n").to_stdout
  end

  it "stops with a clear message when the file doesn't exist" do
    expect { invoke("datewise:import", "nope.csv") }
      .to raise_error(SystemExit).and output(/File not found: nope.csv/).to_stderr
  end
end
