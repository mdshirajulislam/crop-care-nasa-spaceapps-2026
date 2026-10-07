import httpx
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://127.0.0.1:8000/api/v1"

async def test_crud():
    print("🌾 TESTING DYNAMIC CRUD & USER INPUT CAPABILITIES...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Test Add, Edit, Delete Plot
        print("\n1. Testing Dynamic Plot Management (Add, Edit, Delete)...")
        p_res = await client.post(f"{BASE_URL}/plots/", json={
            "name": "প্লট ৩ - দক্ষিণের জমি",
            "crop_name": "বোরো ধান",
            "crop_variety": "ব্রি ধান ৮৯",
            "area_value": 2.5,
            "area_unit": "bigha",
            "soil_type": "দোআঁশ মাটি",
            "irrigation_source": "গভীর নলকূপ"
        })
        assert p_res.status_code == 200, f"Add plot failed: {p_res.text}"
        new_plot_id = p_res.json()["plot"]["id"]
        print(f"   [OK] Added Plot ID: {new_plot_id}")

        # Edit Plot
        p_edit = await client.put(f"{BASE_URL}/plots/{new_plot_id}", json={
            "name": "প্লট ৩ - দক্ষিণের জমি (সংশোধিত)",
            "area_value": 3.0
        })
        assert p_edit.status_code == 200
        print(f"   [OK] Edited Plot Name: {p_edit.json()['plot']['name']}")

        # Delete Plot
        p_del = await client.delete(f"{BASE_URL}/plots/{new_plot_id}")
        assert p_del.status_code == 200
        print(f"   [OK] Deleted Plot ID: {new_plot_id}")

        # 2. Test Add, Edit, Delete Activity
        print("\n2. Testing Dynamic Farm Activities (Add, Edit, Delete)...")
        act_res = await client.post(f"{BASE_URL}/diary/activities", json={
            "activity_type": "সার প্রয়োগ",
            "date": "2026-10-07",
            "details": "টেস্ট ইউরিয়া সার প্রয়োগ",
            "cost": 500,
            "worker_count": 1
        })
        assert act_res.status_code == 200
        act_id = act_res.json()["activity"]["id"]
        print(f"   [OK] Added Activity ID: {act_id}")

        act_edit = await client.put(f"{BASE_URL}/diary/activities/{act_id}", json={
            "details": "ইউরিয়া ২৫ কেজি প্রয়োগ (হালনাগাদ)",
            "cost": 600
        })
        assert act_edit.status_code == 200
        print(f"   [OK] Edited Activity: {act_edit.json()['activity']['details']}")

        act_del = await client.delete(f"{BASE_URL}/diary/activities/{act_id}")
        assert act_del.status_code == 200
        print(f"   [OK] Deleted Activity ID: {act_id}")

        # 3. Test Harvest and Sales Incomes
        print("\n3. Testing Harvest & Sales Income Entry...")
        h_res = await client.post(f"{BASE_URL}/diary/harvests", json={
            "crop_yield_kg": 2400,
            "total_sale_amount": 60000,
            "date": "2026-10-07",
            "note": "আড়তে ধান বিক্রয়"
        })
        assert h_res.status_code == 200
        h_id = h_res.json()["harvest"]["id"]
        print(f"   [OK] Added Harvest ID: {h_id} (৳ 60,000 / 2400 kg)")

        # Verify Financials with user's real harvest
        fin_res = await client.get(f"{BASE_URL}/diary/financial-summary")
        assert fin_res.status_code == 200
        fin = fin_res.json()
        print(f"   [OK] Recalculated Total Income: ৳ {fin['total_income_bdt']}")
        print(f"   [OK] Recalculated Net Profit: ৳ {fin['net_profit_loss_bdt']}")

        # 4. Test Profile Update
        print("\n4. Testing Profile Update & Persistence...")
        prof_res = await client.put(f"{BASE_URL}/auth/profile", json={
            "name": "মোঃ সিরাজুল ইসলাম",
            "village": "চর নিলক্ষীয়া",
            "upazila": "ময়মনসিংহ সদর",
            "district": "ময়মনসিংহ"
        })
        assert prof_res.status_code == 200
        print(f"   [OK] Updated Profile: {prof_res.json()['user']['name']}")

    print("\n✅ ALL DYNAMIC CRUD, INPUTS, EDITS & DELETES VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_crud())
