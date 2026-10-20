require "rails_helper"

# Unless a test says otherwise, "today" is Tuesday 10 November 2026 at 10:00
# in London (GMT, so London time equals UTC). Tomorrow is Wednesday the 11th,
# the next Sunday is the 15th, and the 30-day window ends on Thursday 10 December.
RSpec.describe AvailabilityCalculator do
  let(:morning) { Time.utc(2026, 11, 10, 10, 0) }
  let(:product) { build(:product, lead_time_days: 0, stock: 10) }

  def calculator(now: morning, product: self.product, **data)
    described_class.new(product:, now:, **data)
  end

  def reason(date, **options)
    calculator(**options).check(date).reason
  end

  def nov(day) = Date.new(2026, 11, day)

  describe "a date that passes every rule" do
    it "is available, with no reason" do
      result = calculator.check(nov(11))

      expect(result.date).to eq(nov(11))
      expect(result).to be_available
      expect(result.reason).to be_nil
    end
  end

  describe "rule 1: no dates in the past or today" do
    it "rejects today" do
      expect(reason(nov(10))).to eq(:past)
    end

    it "rejects yesterday" do
      expect(reason(nov(9))).to eq(:past)
    end

    it "works out today in London, not UTC" do
      # 23:30 UTC on 30 March 2026 is 00:30 on the 31st in London (BST).
      late_evening_utc = Time.utc(2026, 3, 30, 23, 30)

      expect(reason(Date.new(2026, 3, 31), now: late_evening_utc)).to eq(:past)
      expect(reason(Date.new(2026, 4, 1), now: late_evening_utc)).to be_nil
    end
  end

  describe "rule 2: tomorrow closes at 14:00 London time today" do
    it "allows tomorrow at 13:59:59" do
      expect(reason(nov(11), now: Time.utc(2026, 11, 10, 13, 59, 59))).to be_nil
    end

    it "rejects tomorrow from 14:00:00" do
      expect(reason(nov(11), now: Time.utc(2026, 11, 10, 14, 0, 0))).to eq(:after_cutoff)
    end

    it "allows the day after tomorrow after the cutoff" do
      expect(reason(nov(12), now: Time.utc(2026, 11, 10, 14, 0, 0))).to be_nil
    end

    context "across the clock changes (same UTC time, different London time)" do
      let(:half_past_one_utc) { [ 13, 30 ] }

      it "treats 13:30 UTC as 13:30 GMT on Friday 27 March, before clocks go forward" do
        now = Time.utc(2026, 3, 27, *half_past_one_utc)

        expect(reason(Date.new(2026, 3, 28), now:)).to be_nil
      end

      it "treats 13:30 UTC as 14:30 BST on Monday 30 March, after clocks go forward" do
        now = Time.utc(2026, 3, 30, *half_past_one_utc)

        expect(reason(Date.new(2026, 3, 31), now:)).to eq(:after_cutoff)
      end

      it "treats 13:30 UTC as 14:30 BST on Friday 23 October, before clocks go back" do
        now = Time.utc(2026, 10, 23, *half_past_one_utc)

        expect(reason(Date.new(2026, 10, 24), now:)).to eq(:after_cutoff)
      end

      it "treats 13:30 UTC as 13:30 GMT on Monday 26 October, after clocks go back" do
        now = Time.utc(2026, 10, 26, *half_past_one_utc)

        expect(reason(Date.new(2026, 10, 27), now:)).to be_nil
      end
    end
  end

  describe "rule 3: no delivery on Sundays or bank holidays" do
    it "rejects a Sunday" do
      expect(reason(nov(15))).to eq(:closed)
    end

    it "allows a Saturday" do
      expect(reason(nov(14))).to be_nil
    end

    it "rejects a bank holiday" do
      expect(reason(nov(12), bank_holidays: [ nov(12) ])).to eq(:closed)
    end
  end

  describe "rule 4: an admin can close a date" do
    it "rejects a closed date" do
      expect(reason(nov(13), closed_dates: [ nov(13) ])).to eq(:closed)
    end

    it "leaves other dates open" do
      expect(reason(nov(12), closed_dates: [ nov(13) ])).to be_nil
    end
  end

  describe "rule 5: each date has a capacity" do
    it "has a default capacity matching the delivery_days column default" do
      expect(described_class::DEFAULT_CAPACITY).to eq(DeliveryDay.new.capacity)
    end

    it "allows a date with one slot left" do
      expect(reason(nov(12), booked_counts: { nov(12) => 49 })).to be_nil
    end

    it "rejects a date at the default capacity of 50" do
      expect(reason(nov(12), booked_counts: { nov(12) => 50 })).to eq(:fully_booked)
    end

    it "uses a per-date capacity when there is one" do
      data = { capacities: { nov(12) => 10 }, booked_counts: { nov(12) => 10 } }

      expect(reason(nov(12), **data)).to eq(:fully_booked)
    end

    it "treats a capacity of zero as fully booked" do
      expect(reason(nov(12), capacities: { nov(12) => 0 })).to eq(:fully_booked)
    end
  end

  describe "rule 6: lead time adds days after the earliest normal date" do
    let(:product) { build(:product, lead_time_days: 2, stock: 10) }

    it "with a 2-day lead time before the cutoff, the first date is 3 days away" do
      expect(reason(nov(11))).to eq(:lead_time)
      expect(reason(nov(12))).to eq(:lead_time)
      expect(reason(nov(13))).to be_nil
    end

    it "with a 2-day lead time after the cutoff, the first date is 4 days away" do
      after_cutoff = Time.utc(2026, 11, 10, 15, 0)

      expect(reason(nov(13), now: after_cutoff)).to eq(:lead_time)
      expect(reason(nov(14), now: after_cutoff)).to be_nil
    end

    it "with no lead time, adds nothing" do
      expect(reason(nov(11), product: build(:product, lead_time_days: 0))).to be_nil
    end
  end

  describe "rule 7: a product with no stock has no dates" do
    it "rejects every date" do
      expect(reason(nov(12), product: build(:product, stock: 0))).to eq(:out_of_stock)
    end
  end

  describe "rule 8: bookings up to 30 days ahead" do
    it "allows the 30th day" do
      expect(reason(Date.new(2026, 12, 10))).to be_nil
    end

    it "rejects the 31st day" do
      expect(reason(Date.new(2026, 12, 11))).to eq(:too_far)
    end
  end

  describe "when several rules fail, the first in rule order wins" do
    let(:out_of_stock) { build(:product, stock: 0, lead_time_days: 2) }

    it "reports past before anything else" do
      expect(reason(nov(10), product: out_of_stock)).to eq(:past)
    end

    it "reports a Sunday as closed even when it is also full and out of stock" do
      data = { booked_counts: { nov(15) => 50 }, product: out_of_stock }

      expect(reason(nov(15), **data)).to eq(:closed)
    end

    it "reports lead time before out of stock" do
      expect(reason(nov(12), product: out_of_stock)).to eq(:lead_time)
    end

    it "reports a Sunday beyond the window as closed rather than too far" do
      expect(reason(Date.new(2026, 12, 13))).to eq(:closed)
    end
  end

  describe "#range" do
    it "returns one result per date, in order" do
      results = calculator.range(nov(10), nov(15))

      expect(results.map(&:date)).to eq((nov(10)..nov(15)).to_a)
      expect(results.map(&:reason)).to eq([ :past, nil, nil, nil, nil, :closed ])
    end
  end
end
