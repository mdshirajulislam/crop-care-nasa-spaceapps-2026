import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models.models import User, Plot, FarmActivity, Expense, HarvestIncome, DiseaseDiagnosis, OutbreakAlert

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Create Farmer Profile
    user = User(
        name="মোঃ সিরাজুল ইসলাম",
        phone="01712345678",
        village="চর নিলক্ষীয়া",
        upazila="ময়মনসিংহ সদর",
        district="ময়মনসিংহ",
        language="bn",
        preferred_land_unit="bigha",
        lat=24.7471,
        lon=90.4203
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. Create Farmer's Plot (3.5 Bigha Aman Rice in Mymensingh)
    plot1 = Plot(
        user_id=user.id,
        name="প্লট ১ - পূর্বের মাঠ",
        crop_name="আমন ধান",
        crop_variety="ব্রি ধান ৪৯ (BRRI Dhan 49)",
        planting_date="2026-07-20",
        expected_harvest_date="2026-11-25",
        area_value=3.5,
        area_unit="bigha", # 3.5 bigha = 115.5 decimal
        soil_type="দোআঁশ মাটি (Loamy)",
        irrigation_source="গভীর নলকূপ (Deep Tubewell)",
        current_stage="কুশি গজানো পর্যায় (Tillering Stage)",
        health_status="ভালো (Good Health)",
        ndvi_score=0.68,
        polygon_geojson='{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[90.418,24.745],[90.422,24.745],[90.422,24.749],[90.418,24.749],[90.418,24.745]]]}}'
    )
    db.add(plot1)
    db.commit()
    db.refresh(plot1)

    # 3. Seed Farm Activities
    activities = [
        FarmActivity(
            user_id=user.id,
            plot_id=plot1.id,
            activity_type="জমি তৈরি ও চাষ",
            date="2026-07-15",
            details="ট্রাক্টর দিয়ে ৩ বার গভীর চাষ ও মই দিয়ে জমি সমান করা হয়েছে।",
            cost=3200.0,
            worker_count=2
        ),
        FarmActivity(
            user_id=user.id,
            plot_id=plot1.id,
            activity_type="চারা রোপণ",
            date="2026-07-20",
            details="ব্রি ধান ৪৯ জাতের ২৫ দিন বয়সের সুস্থ চারা সারিবদ্ধভাবে রোপণ করা হয়েছে।",
            cost=4500.0,
            worker_count=5
        ),
        FarmActivity(
            user_id=user.id,
            plot_id=plot1.id,
            activity_type="সার প্রয়োগ",
            date="2026-08-05",
            details="১ম কিস্তি ইউরিয়া ৩০ কেজি এবং জিপসাম ২৫ কেজি উপরিপ্রয়োগ করা হয়েছে।",
            cost=1450.0,
            worker_count=1
        ),
        FarmActivity(
            user_id=user.id,
            plot_id=plot1.id,
            activity_type="নিড়ানি ও আগাছা দমন",
            date="2026-08-25",
            details="হাতে নিড়ানি দিয়ে সম্পূর্ণ ৩.৫ বিঘার ঘাস ও আগাছা পরিষ্কার করা হয়েছে।",
            cost=2800.0,
            worker_count=4
        )
    ]
    db.add_all(activities)

    # 4. Seed Expenses
    expenses = [
        Expense(user_id=user.id, plot_id=plot1.id, category="যন্ত্র ও চাষ", amount=3200.0, date="2026-07-15", description="পাওয়ার টিলার চাষ ও মই খরচ"),
        Expense(user_id=user.id, plot_id=plot1.id, category="বীজ", amount=1200.0, date="2026-07-16", description="ব্রি ধান ৪৯ প্রত্যায়িত বীজ ১০ কেজি"),
        Expense(user_id=user.id, plot_id=plot1.id, category="শ্রমিক", amount=4500.0, date="2026-07-20", description="চারা রোপণে ৫ জন শ্রমিকের মজুরি"),
        Expense(user_id=user.id, plot_id=plot1.id, category="সার", amount=1450.0, date="2026-08-05", description="ইউরিয়া ও জিপসাম সার ক্রয়"),
        Expense(user_id=user.id, plot_id=plot1.id, category="শ্রমিক", amount=2800.0, date="2026-08-25", description="নিড়ানি খরচ ৪ জন শ্রমিক"),
        Expense(user_id=user.id, plot_id=plot1.id, category="সেচ", amount=1800.0, date="2026-09-02", description="নলকূপ সেচ চার্জ")
    ]
    db.add_all(expenses)

    # 5. Seed Outbreak Alert
    outbreak = OutbreakAlert(
        district="ময়মনসিংহ",
        upazila="ময়মনসিংহ সদর",
        crop="আমন ধান",
        disease_name="ধানের ব্লাস্ট রোগ (Rice Blast)",
        alert_level="সতর্কতা (High Alert)",
        report_count=14,
        message_bn="আপনার উপজেলায় (ময়মনসিংহ সদর) বিগত ৩ দিনে ১৪ জন কৃষক ধানের ব্লাস্ট রোগের রিপোর্ট করেছেন। স্যাঁতসেঁতে আবহাওয়ার কারণে আপনার জমিতেও আগাম সতর্কতা অবলম্বন করুন।",
        date="2026-10-06"
    )
    db.add(outbreak)

    db.commit()
    db.close()
    print("Database seeded successfully with Mymensingh 3.5 Bigha Aman demo data!")

if __name__ == "__main__":
    seed_database()
