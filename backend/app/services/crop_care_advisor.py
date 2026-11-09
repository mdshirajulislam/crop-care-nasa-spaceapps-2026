import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

# Knowledgebase of crops with authentic Bangladeshi Agricultural Research (BRRI, BARI) data
CROP_DATABASE = {
    "aman_rice": {
        "id": "aman_rice",
        "name_bn": "রোপা আমন ধান",
        "name_en": "Transplanted Aman Rice",
        "popular_varieties": ["ব্রি ধান ৪৯", "ব্রি ধান ৮৭", "ব্রি ধান ৩৪ (সুগন্ধি)", "ব্রি ধান ৭১", "স্বর্ণা", "বিনা ধান-৭"],
        "duration_days": 130,
        "base_unit": "bigha", # 33 decimals
        "stages": [
            {"id": "s1", "start_day": 0, "end_day": 15, "name_bn": "চারা রোপণ ও শিকড় স্থাপন", "name_en": "Transplanting & Rooting", "desc_bn": "চারা লেগে যাওয়া ও নতুন শিকড় গজানো"},
            {"id": "s2", "start_day": 16, "end_day": 35, "name_bn": "কুশি গজানো পর্যায়", "name_en": "Active Tillering", "desc_bn": "গাছের গোড়া থেকে দ্রুত কুশি বিস্তার"},
            {"id": "s3", "start_day": 36, "end_day": 55, "name_bn": "সর্বোচ্চ কুশি ও কাইচথোড় পূর্ব", "name_en": "Maximum Tillering", "desc_bn": "কুশির সংখ্যা চূড়ান্ত হওয়া"},
            {"id": "s4", "start_day": 56, "end_day": 75, "name_bn": "কাইচথোড় ও থোড় আসা", "name_en": "Panicle Initiation & Booting", "desc_bn": "শীষ গর্ভে আসা ও ফোলা"},
            {"id": "s5", "start_day": 76, "end_day": 90, "name_bn": "শীষ বের হওয়া ও ফুল ফোটা", "name_en": "Flowering & Pollination", "desc_bn": "ফুল ফোটা ও পরাগায়ন"},
            {"id": "s6", "start_day": 91, "end_day": 110, "name_bn": "দুধ ও নরম দানা গঠন", "name_en": "Milk & Dough Stage", "desc_bn": "শীষে চালের দানা তৈরি হওয়া"},
            {"id": "s7", "start_day": 111, "end_day": 130, "name_bn": "পরিপক্বতা ও ধান কর্তন", "name_en": "Ripening & Harvest", "desc_bn": "৮০-৮৫% ধান সোনালী হলে কর্তন"}
        ],
        "base_fertilizer_per_bigha": {
            "urea": 26.0,
            "tsp": 14.0,
            "mop": 12.0,
            "gypsum": 9.0,
            "zinc_sulfate": 1.0,
            "boron": 0.5
        },
        "fertilizer_plan": [
            {
                "task_id": "fert_basal",
                "day": 0,
                "title_bn": "জমি তৈরির শেষ চাষে সার প্রয়োগ (বেসাল ডোজ)",
                "title_en": "Basal Fertilizer at Final Plowing",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "টিএসপি (TSP) / ডিএপি", "key": "tsp", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ) - ১ম ভাগ", "key": "mop", "ratio": 0.6, "unit": "কেজি"},
                    {"name_bn": "জিপসাম", "key": "gypsum", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "জিংক সালফেট (দস্তা)", "key": "zinc_sulfate", "ratio": 1.0, "unit": "কেজি"}
                ],
                "instructions_bn": "জমি তৈরির শেষ চাষে টিএসপি, জিপসাম, জিংক ও পটাশের অর্ধেকের বেশি সার ছিটিয়ে মাটির সাথে ভালোভাবে মিশিয়ে দিন। কোনো ইউরিয়া শেষ চাষে দেবেন না।"
            },
            {
                "task_id": "fert_top_1",
                "day": 15,
                "title_bn": "১ম কিস্তি ইউরিয়া উপরিপ্রয়োগ",
                "title_en": "1st Urea Top Dressing",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (১ম কিস্তি)", "key": "urea", "ratio": 0.35, "unit": "কেজি"}
                ],
                "instructions_bn": "চারা রোপণের ১৫-২০ দিন পর আগাছা পরিষ্কার করে জমিতে ছিপছিপে পানির অবস্থায় ইউরিয়া সমানভাবে ছিটান।"
            },
            {
                "task_id": "fert_top_2",
                "day": 35,
                "title_bn": "২য় কিস্তি ইউরিয়া উপরিপ্রয়োগ (কুশি পর্যায়)",
                "title_en": "2nd Urea Top Dressing (Tillering)",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (২য় কিস্তি)", "key": "urea", "ratio": 0.35, "unit": "কেজি"}
                ],
                "instructions_bn": "কুশি দ্রুত গজানোর জন্য এই কিস্তি অত্যন্ত গুরুত্বপূর্ণ। সার দেওয়ার সময় জমিতে হালকা পানি থাকা উচিত।"
            },
            {
                "task_id": "fert_top_3",
                "day": 55,
                "title_bn": "৩য় কিস্তি ইউরিয়া ও বাকি পটাশ (কাইচথোড় আসার ৫-৭ দিন পূর্বে)",
                "title_en": "3rd Urea & MOP Top Dressing (Pre-Booting)",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (৩য় কিস্তি)", "key": "urea", "ratio": 0.30, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ) - বাকি ভাগ", "key": "mop", "ratio": 0.4, "unit": "কেজি"}
                ],
                "instructions_bn": "কাইচথোড় আসার মুখে পটাশ ও ইউরিয়া দিলে শীষ বড় ও পরিপুষ্ট হয়, চিটা কম হয়। গাছ অতিরিক্ত কালো বা নরম থাকলে ইউরিয়া কমান।"
            }
        ],
        "spray_plan": [
            {
                "task_id": "spray_1",
                "day": 20,
                "title_bn": "১ম প্রতিরোধক স্প্রে: মাজরা ও পামরি পোকা দমন",
                "title_en": "1st Protective Spray: Stem Borer & Hispa",
                "type": "spray",
                "target_pest_bn": "মাজরা পোকা, পামরি পোকা ও গোড়া পচা ছত্রাক",
                "medicines_bn": "ভিরতাকো ৪০ ডব্লিউজি (Virtako) অথবা ভলিউম ফ্লেক্সি / কার্বোফিউরান ৫জি",
                "dosage_bn": "ভিরতাকো: ১.৫ গ্রাম প্রতি ১০ লিটার পানিতে (বিঘায় মোট ৬০ লিটার পানিতে ৯ গ্রাম) অথবা দানাদার কার্বোফিউরান বিঘায় ১.৫ কেজি ছিটানো",
                "instructions_bn": "সকালের শিশির শুকানোর পর বা বিকেলে পাতার ওপর ও গোড়ায় সমানভাবে স্প্রে করুন। মাজরার মথ বা ডিমের গাদা দেখলে হাত দিয়ে সংগ্রহ করে নষ্ট করুন।"
            },
            {
                "task_id": "spray_2",
                "day": 38,
                "title_bn": "২য় স্প্রে: পাতা মোড়ানো পোকা ও খোলপোড়া রোগ প্রতিরোধ",
                "title_en": "2nd Spray: Leaf Roller & Sheath Blight",
                "type": "spray",
                "target_pest_bn": "পাতা মোড়ানো পোকা, বাদামি গাছফড়িং ও খোলপোড়া রোগ",
                "medicines_bn": "এমিস্টার টপ ৩২৫ এসসি (Amistar Top) অথবা টিল্ট ২৫০ ইসি (Tilt)",
                "dosage_bn": "এমিস্টার টপ: ১ মিলি প্রতি লিটার পানি (বিঘায় ৫০ মিলি ৫০ লিটার পানিতে)",
                "instructions_bn": "গাছের গোড়ার দিকে ভালো করে স্প্রে করুন যাতে খোলপোড়া রোগ না ছড়ায়। মেঘলা দিনে স্প্রে এড়িয়ে রৌদ্রোজ্জ্বল দিনে বিকেলে স্প্রে করুন।"
            },
            {
                "task_id": "spray_3",
                "day": 62,
                "title_bn": "৩য় বিশেষ স্প্রে: ধানের পাতা ও শীষ ব্লাস্ট রোগ প্রতিরোধ",
                "title_en": "3rd Critical Spray: Neck & Leaf Blast Prevention",
                "type": "spray",
                "target_pest_bn": "শীষ ব্লাস্ট (Neck Blast), খোলপচা ও চিটা রোধ",
                "medicines_bn": "নাটিভো ৭৫ ডব্লিউজি (Nativo) অথবা ট্রুপার ৭৫ ডব্লিউপি (Trooper)",
                "dosage_bn": "নাটিভো: ০.৬ গ্রাম প্রতি লিটার পানি (বিঘায় ৩০ গ্রাম ৫০ লিটার পানিতে) অথবা ট্রুপার ১ গ্রাম/লিটার",
                "instructions_bn": "শীষ বের হওয়ার ঠিক পূর্বে এই প্রতিষেধক স্প্রে অত্যন্ত জরুরি। কুয়াশাচ্ছন্ন বা বৃষ্টি-পরবর্তী গরমে ব্লাস্টের প্রকোপ বাড়ে। এটি চিটা মুক্ত স্বাস্থ্যবান ধানের গ্যারান্টি দেয়।"
            },
            {
                "task_id": "spray_4",
                "day": 78,
                "title_bn": "৪র্থ স্প্রে: শীষ বের হওয়ার পর ব্লাস্টের ২য় স্প্রে ও গান্ধী পোকা দমন",
                "title_en": "4th Spray: Post-Flowering Blast & Stink Bug",
                "type": "spray",
                "target_pest_bn": "শীষ ব্লাস্ট ও গান্ধী পোকা (দুধ চোষা পোকা)",
                "medicines_bn": "ট্রুপার ৭৫ ডব্লিউপি + ক্যারাটে ২.৫ ইসি (ল্যাম্বডা সাইহ্যালোথ্রিন)",
                "dosage_bn": "ট্রুপার ১ গ্রাম/লিটার + ক্যারাটে ১ মিলি/লিটার পানি",
                "instructions_bn": "শীষ পুরোপুরি বের হলে বিকেলে স্প্রে করুন। ফুল ফোটার সময় (সকাল ১০টা থেকে দুপুর ২টা) পরাগায়ন হয়, এই সময় স্প্রে করা নিষিদ্ধ।"
            }
        ],
        "irrigation_plan": [
            {"day": 0, "title_bn": "চারা রোপণের সময় ২-৩ সেমি পানি রাখুন"},
            {"day": 20, "title_bn": "সার দেওয়ার আগে পানি শুকিয়ে নিন, দেওয়ার পর হালকা সেচ"},
            {"day": 60, "title_bn": "থোড় ও ফুল আসার সময় জমিতে পর্যাপ্ত রস/পানি নিশ্চিত করুন (খরা সহ্য করতে পারে না)"},
            {"day": 115, "title_bn": "ফসল কাটার ১০-১২ দিন পূর্বে জমির সমস্ত পানি শুকিয়ে ফেলুন"}
        ]
    },
    "boro_rice": {
        "id": "boro_rice",
        "name_bn": "বোরো ধান",
        "name_en": "Boro Rice",
        "popular_varieties": ["ব্রি ধান ২৮", "ব্রি ধান ২৯", "ব্রি ধান ৮৮", "ব্রি ধান ৮৯", "ব্রি ধান ৯২", "হাইব্রিড হীরা ২", "তেজ গোল্ড"],
        "duration_days": 150,
        "base_unit": "bigha",
        "stages": [
            {"id": "s1", "start_day": 0, "end_day": 20, "name_bn": "চারা রোপণ ও শীতকালীন অভিযোজন", "name_en": "Transplanting & Cold Adaptation", "desc_bn": "শৈত্যপ্রবাহে চারা রক্ষা ও শিকড় বিস্তার"},
            {"id": "s2", "start_day": 21, "end_day": 45, "name_bn": "কুশি বিস্তার পর্যায়", "name_en": "Tillering Stage", "desc_bn": "তাপমাত্রা বাড়ার সাথে সাথে কুশি বৃদ্ধি"},
            {"id": "s3", "start_day": 46, "end_day": 70, "name_bn": "সর্বোচ্চ কুশি ও কাণ্ড বৃদ্ধি", "name_en": "Stem Elongation", "desc_bn": "গাছের উচ্চতা ও কুশি সুসংহত হওয়া"},
            {"id": "s4", "start_day": 71, "end_day": 95, "name_bn": "কাইচথোড় ও থোড় আসা", "name_en": "Panicle Booting", "desc_bn": "শীষ বের হওয়ার প্রস্তুতি"},
            {"id": "s5", "start_day": 96, "end_day": 115, "name_bn": "শীষ বের হওয়া ও পরাগায়ন", "name_en": "Heading & Flowering", "desc_bn": "মার্চ-এপ্রিলের শুরুতে ফুল ফোটা"},
            {"id": "s6", "start_day": 116, "end_day": 135, "name_bn": "দানা শক্ত হওয়া (Dough Stage)", "name_en": "Grain Dough", "desc_bn": "দানা ভারি হওয়া ও পরিপুষ্ট হওয়া"},
            {"id": "s7", "start_day": 136, "end_day": 150, "name_bn": "পরিপক্বতা ও ধান কর্তন", "name_en": "Ripening & Harvest", "desc_bn": "কালবৈশাখী ও আগাম বন্যার পূর্বে কর্তন"}
        ],
        "base_fertilizer_per_bigha": {
            "urea": 35.0,
            "tsp": 16.0,
            "mop": 16.0,
            "gypsum": 12.0,
            "zinc_sulfate": 1.5,
            "boron": 0.8
        },
        "fertilizer_plan": [
            {
                "task_id": "b_fert_basal",
                "day": 0,
                "title_bn": "জমি তৈরির শেষ চাষে সার প্রয়োগ",
                "title_en": "Basal Fertilizer at Final Plowing",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "টিএসপি / ডিএপি", "key": "tsp", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ) - ১ম ভাগ", "key": "mop", "ratio": 0.5, "unit": "কেজি"},
                    {"name_bn": "জিপসাম", "key": "gypsum", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "জিংক সালফেট", "key": "zinc_sulfate", "ratio": 1.0, "unit": "কেজি"}
                ],
                "instructions_bn": "শেষ চাষের সময় সমস্ত টিএসপি, জিপসাম, জিংক ও অর্ধেক পটাশ মাটির সাথে মিশিয়ে দিন।"
            },
            {
                "task_id": "b_fert_top_1",
                "day": 20,
                "title_bn": "১ম কিস্তি ইউরিয়া উপরিপ্রয়োগ",
                "title_en": "1st Urea Top Dressing",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (১ম কিস্তি)", "key": "urea", "ratio": 0.34, "unit": "কেজি"}
                ],
                "instructions_bn": "চারা রোপণের ২০ দিন পর আগাছা নিড়ানি দিয়ে ইউরিয়ার ১ম কিস্তি দিন।"
            },
            {
                "task_id": "b_fert_top_2",
                "day": 40,
                "title_bn": "২য় কিস্তি ইউরিয়া উপরিপ্রয়োগ",
                "title_en": "2nd Urea Top Dressing",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (২য় কিস্তি)", "key": "urea", "ratio": 0.33, "unit": "কেজি"}
                ],
                "instructions_bn": "কুশি গজানোর শীর্ষ সময়ে এই কিস্তি সমানভাবে প্রয়োগ করুন।"
            },
            {
                "task_id": "b_fert_top_3",
                "day": 65,
                "title_bn": "৩য় কিস্তি ইউরিয়া ও বাকি পটাশ সার",
                "title_en": "3rd Urea & Remaining MOP",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (৩য় কিস্তি)", "key": "urea", "ratio": 0.33, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ) - ২য় ভাগ", "key": "mop", "ratio": 0.5, "unit": "কেজি"}
                ],
                "instructions_bn": "কাইচথোড় আসার মুখে ইউরিয়ার সাথে বাকি অর্ধেক পটাশ দিলে রোগবালাই কমে ও শীষের ওজন বাড়ে।"
            }
        ],
        "spray_plan": [
            {
                "task_id": "b_spray_1",
                "day": 25,
                "title_bn": "১ম স্প্রে: মাজরা পোকা ও কোল্ড ইনজুরি প্রতিরোধ",
                "title_en": "1st Spray: Stem Borer & Cold Protection",
                "type": "spray",
                "target_pest_bn": "মাজরা পোকা ও শীতের কারণে চারা হলুদ হওয়া",
                "medicines_bn": "ভিরতাকো ৪০ ডব্লিউজি অথবা কার্বোফিউরান ৫জি",
                "dosage_bn": "ভিরতাকো ১.৫ গ্রাম প্রতি ১০ লিটার পানিতে অথবা কার্বোফিউরান বিঘায় ১.৫ কেজি",
                "instructions_bn": "শীতকালে রাতে জমিতে ২-৩ ইঞ্চি পানি রাখলে কোল্ড ইনজুরি থেকে রক্ষা পাওয়া যায়।"
            },
            {
                "task_id": "b_spray_2",
                "day": 50,
                "title_bn": "২য় স্প্রে: পাতা মোড়ানো পোকা ও খোলপোড়া রোগ দমন",
                "title_en": "2nd Spray: Leaf Roller & Sheath Blight",
                "type": "spray",
                "target_pest_bn": "খোলপোড়া রোগ ও পাতা মোড়ানো পোকা",
                "medicines_bn": "এমিস্টার টপ ৩২৫ এসসি অথবা ফলিকুর / স্কোর",
                "dosage_bn": "১ মিলি প্রতি লিটার পানি (বিঘায় ৬০ মিলি ৬০ লিটার পানিতে)",
                "instructions_bn": "গাছের গোড়ার দিকে ভালো করে স্প্রে করুন।"
            },
            {
                "task_id": "b_spray_3",
                "day": 75,
                "title_bn": "৩য় প্রধান স্প্রে: বোরো ধানের নেক ব্লাস্ট (ঘাড় মড়ক) প্রতিরোধ",
                "title_en": "3rd Critical Spray: Neck Blast Prevention",
                "type": "spray",
                "target_pest_bn": "নেক ব্লাস্ট ও শীষ ব্লাস্ট রোগ",
                "medicines_bn": "ট্রুপার ৭৫ ডব্লিউপি অথবা নাটিভো ৭৫ ডব্লিউজি",
                "dosage_bn": "ট্রুপার ১ গ্রাম/লিটার অথবা নাটিভো ০.৬ গ্রাম/লিটার পানি",
                "instructions_bn": "বোরো ধানে ব্রি ২৮ ও ব্রি ২৯ জাতে ব্লাস্ট রোগ বিধ্বংসী ক্ষতি করে। শীষ বের হওয়ার মুখে এই স্প্রে মিস করা যাবে না!"
            },
            {
                "task_id": "b_spray_4",
                "day": 95,
                "title_bn": "৪র্থ স্প্রে: বাদামী গাছফড়িং (কারেন্ট পোকা) ও গান্ধী পোকা দমন",
                "title_en": "4th Spray: BPH (Brown Planthopper) Alert",
                "type": "spray",
                "target_pest_bn": "বাদামি গাছফড়িং (BPH) ও গান্ধী পোকা",
                "medicines_bn": "চেস ৫০ ডব্লিউজি (Pymetrozine) অথবা মিয়াফুরাজ / পাইমেট্রোজিন",
                "dosage_bn": "চেস ০.৬ গ্রাম প্রতি লিটার পানি",
                "instructions_bn": "গাছের গোড়া ফাঁক করে দেখুন পোকা আছে কিনা। পোকা থাকলে গোড়ায় স্প্রে করুন।"
            }
        ],
        "irrigation_plan": [
            {"day": 0, "title_bn": "রোপণের পর হালকা পানি বজায় রাখুন"},
            {"day": 30, "title_bn": "AWD (পর্যায়ক্রমে ভেজানো ও শুকানো) পদ্ধতি অনুসরণ করে পানি সাশ্রয় করুন"},
            {"day": 75, "title_bn": "থোড় ও ফুল ফোটার সময় জমিতে অবশ্যই পানি ধরে রাখুন"},
            {"day": 135, "title_bn": "ধান কাটার ১০ দিন আগে সেচ বন্ধ করুন"}
        ]
    },
    "potato": {
        "id": "potato",
        "name_bn": "আলু",
        "name_en": "Potato",
        "popular_varieties": ["ডায়মন্ড (Diamant)", "কার্ডিনাল (Cardinal)", "গ্রানোলা (Granola)", "বারি আলু-৭ (এস্টারিক্স)", "লেডি রোসেটা"],
        "duration_days": 90,
        "base_unit": "bigha",
        "stages": [
            {"id": "s1", "start_day": 0, "end_day": 15, "name_bn": "কন্দ রোপণ ও অঙ্কুরোদগম", "name_en": "Sprouting", "desc_bn": "মাটি ভেদ করে চারা গজানো"},
            {"id": "s2", "start_day": 16, "end_day": 30, "name_bn": "অঙ্গজ বৃদ্ধি ও পাতা বিস্তার", "name_en": "Vegetative Growth", "desc_bn": "গাছের দ্রুত বৃদ্ধি ও ডালপালা বিস্তার"},
            {"id": "s3", "start_day": 31, "end_day": 50, "name_bn": "মাটিতে কন্দ সূচনা ও বৃদ্ধি (Tuberization)", "name_en": "Tuber Initiation", "desc_bn": "শিকড়ে ছোট ছোট আলু গঠন শুরু"},
            {"id": "s4", "start_day": 51, "end_day": 70, "name_bn": "আলু স্ফীতি ও বড় হওয়া (Tuber Bulking)", "name_en": "Tuber Bulking", "desc_bn": "আলুর আকার ও ওজন দ্রুত বৃদ্ধি"},
            {"id": "s5", "start_day": 71, "end_day": 90, "name_bn": "ত্বক শক্ত হওয়া ও উত্তোলন", "name_en": "Skin Set & Harvesting", "desc_bn": "আলুর চামড়া শক্ত হওয়া ও উত্তোলন"}
        ],
        "base_fertilizer_per_bigha": {
            "urea": 40.0,
            "tsp": 35.0,
            "mop": 40.0,
            "gypsum": 18.0,
            "zinc_sulfate": 1.5,
            "boron": 1.2,
            "cowdung": 800.0
        },
        "fertilizer_plan": [
            {
                "task_id": "pot_fert_basal",
                "day": 0,
                "title_bn": "জমি তৈরির শেষ চাষ ও রোপণে সার প্রয়োগ",
                "title_en": "Basal & Planting Application",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "গোবর সার / কম্পোস্ট", "key": "cowdung", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "টিএসপি / ডিএপি", "key": "tsp", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "ইউরিয়া (অর্ধেক)", "key": "urea", "ratio": 0.5, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ - অর্ধেক)", "key": "mop", "ratio": 0.5, "unit": "কেজি"},
                    {"name_bn": "জিপসাম", "key": "gypsum", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "বোরন ও জিংক", "key": "boron", "ratio": 1.0, "unit": "কেজি"}
                ],
                "instructions_bn": "গোবর, টিএসপি, জিপসাম, বোরন, জিংক এবং ইউরিয়া ও পটাশের অর্ধেক শেষ চাষে মাটিতে মিশিয়ে বীজ রোপণ করুন।"
            },
            {
                "task_id": "pot_fert_top_1",
                "day": 30,
                "title_bn": "গাছের গোড়ায় মাটি তোলার সময় সার প্রয়োগ (Earthing Up)",
                "title_en": "Top Dressing at Earthing Up",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (বাকি অর্ধেক)", "key": "urea", "ratio": 0.5, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ - বাকি অর্ধেক)", "key": "mop", "ratio": 0.5, "unit": "কেজি"}
                ],
                "instructions_bn": "রোপণের ৩০-৩৫ দিন পর বাকি ইউরিয়া ও পটাশ গাছের গোড়ায় দিয়ে ভালো করে মাটি তুলে দিন যাতে আলু রোদে সবুজ না হয়।"
            }
        ],
        "spray_plan": [
            {
                "task_id": "pot_spray_1",
                "day": 25,
                "title_bn": "১ম স্প্রে: আগাম ধসা (Early Blight) ও জাবপোকা প্রতিরোধ",
                "title_en": "1st Spray: Early Blight & Aphids",
                "type": "spray",
                "target_pest_bn": "আগাম ধসা রোগ ও জাবপোকা (ভাইরাস ছড়ায়)",
                "medicines_bn": "ডাইথেন এম-৪৫ (ম্যানকোজেব) + ইমিডাক্লোপ্রিড (এডমায়ার)",
                "dosage_bn": "ডাইথেন এম-৪৫: ২ গ্রাম/লিটার + এডমায়ার: ০.৫ মিলি/লিটার পানি",
                "instructions_bn": "জাবপোকা আলুর মোজাইক ভাইরাস ছড়ায়, তাই চারা অবস্থায় পোকা দমন জরুরি।"
            },
            {
                "task_id": "pot_spray_2",
                "day": 45,
                "title_bn": "২য় স্প্রে: মারাত্মক নাবি ধসা / মড়ক (Late Blight) প্রতিরোধক স্প্রে",
                "title_en": "2nd Spray: Critical Late Blight Alert",
                "type": "spray",
                "target_pest_bn": "আলুর লেট ব্লাইট / মড়ক রোগ (সবচেয়ে বিধ্বংসী রোগ)",
                "medicines_bn": "রিডোমিল গোল্ড এমজেড ৬৮ ডব্লিউজি (Ridomil Gold) অথবা এক্রোবেট এমজেড",
                "dosage_bn": "রিডোমিল গোল্ড: ২ গ্রাম প্রতি লিটার পানি (বিঘায় ১২০ গ্রাম ৬০ লিটার পানিতে)",
                "instructions_bn": "কুয়াশাচ্ছন্ন ভেজা আবহাওয়ায় ১-২ দিনের মধ্যে পুরো মাঠ পুড়ে যেতে পারে। লক্ষণ দেখার আগেই প্রতিষেধক হিসেবে ৭-১০ দিন পরপর স্প্রে করুন।"
            },
            {
                "task_id": "pot_spray_3",
                "day": 65,
                "title_bn": "৩য় স্প্রে: কন্দের বৃদ্ধি, চামড়ার ফাটল রোধ ও ফলন বৃদ্ধি স্প্রে",
                "title_en": "3rd Spray: Tuber Bulking & Boron Micronutrient",
                "type": "spray",
                "target_pest_bn": "কন্দ ফেটে যাওয়া ও ভেতরের ফাঁপা রোগ রোধ",
                "medicines_bn": "সোলোবর বোরন + চিলেটেড জিংক (Solubor Boron + Chelated Zinc)",
                "dosage_bn": "বোরন: ১.৫ গ্রাম/লিটার + জিংক: ১ গ্রাম/লিটার পানি",
                "instructions_bn": "বিকেলে পাতার ওপর ভালো করে ভিজিয়ে স্প্রে করুন। আলুর আকার বড় ও মসৃণ হবে।"
            }
        ],
        "irrigation_plan": [
            {"day": 0, "title_bn": "মাটিতে 'জো' অবস্থায় বীজ রোপণ করুন"},
            {"day": 22, "title_bn": "১ম হালকা সেচ (নালা দিয়ে পানি দিয়ে দ্রুত বের করে দিন)"},
            {"day": 40, "title_bn": "২য় সেচ (কন্দ গঠনের সময়ে মাটির পর্যাপ্ত রস নিশ্চিত করুন)"},
            {"day": 60, "title_bn": "৩য় সেচ (আলু স্ফীতি পর্যায়)"},
            {"day": 78, "title_bn": "আলু তোলার ১০-১২ দিন পূর্বে সেচ পুরোপুরি বন্ধ করুন"}
        ]
    },
    "mustard": {
        "id": "mustard",
        "name_bn": "সরিষা",
        "name_en": "Mustard",
        "popular_varieties": ["বারি সরিষা-১৪", "বারি সরিষা-১৫", "বারি সরিষা-১৭", "বারি সরিষা-১৮", "টোরি-৭"],
        "duration_days": 85,
        "base_unit": "bigha",
        "stages": [
            {"id": "s1", "start_day": 0, "end_day": 12, "name_bn": "বীজ বপন ও অঙ্কুরোদগম", "name_en": "Germination", "desc_bn": "বীজ ফেটে সবুজ পাতা বের হওয়া"},
            {"id": "s2", "start_day": 13, "end_day": 28, "name_bn": "চারা পর্যায় ও অঙ্গজ বৃদ্ধি", "name_en": "Seedling Growth", "desc_bn": "গাছের পাতার সংখ্যা ও মূল বৃদ্ধি"},
            {"id": "s3", "start_day": 29, "end_day": 50, "name_bn": "হলুদ ফুল ফোটা ও পড গঠন", "name_en": "Flowering & Siliqua", "desc_bn": "মাঠজুড়ে হলুদ ফুল ও মৌমাছির পরাগায়ন"},
            {"id": "s4", "start_day": 51, "end_day": 70, "name_bn": "দানায় তেল ও পুষ্ট হওয়া", "name_en": "Seed Filling", "desc_bn": "পডের ভেতরে সরিষা দানা শক্ত হওয়া"},
            {"id": "s5", "start_day": 71, "end_day": 85, "name_bn": "পরিপক্বতা ও ফসল কর্তন", "name_en": "Ripening & Harvest", "desc_bn": "গাছ ও পড হলুদাভ সোনালী হলে কর্তন"}
        ],
        "base_fertilizer_per_bigha": {
            "urea": 22.0,
            "tsp": 24.0,
            "mop": 12.0,
            "gypsum": 20.0,
            "zinc_sulfate": 1.0,
            "boron": 1.2
        },
        "fertilizer_plan": [
            {
                "task_id": "mus_fert_basal",
                "day": 0,
                "title_bn": "জমি তৈরির শেষ চাষে সার প্রয়োগ",
                "title_en": "Basal Fertilizer at Sowing",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "টিএসপি / ডিএপি", "key": "tsp", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ)", "key": "mop", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "জিপসাম (সালফার তেল বাড়ায়)", "key": "gypsum", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "বোরন ও জিংক", "key": "boron", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "ইউরিয়া (অর্ধেক)", "key": "urea", "ratio": 0.5, "unit": "কেজি"}
                ],
                "instructions_bn": "সরিষায় জিপসাম (সালফার) ও বোরন অপরিহার্য, এতে দানায় তেলের পরিমাণ বহুগুণ বাড়ে। অর্ধেক ইউরিয়া শেষ চাষে দিন।"
            },
            {
                "task_id": "mus_fert_top_1",
                "day": 25,
                "title_bn": "ফুল আসার পূর্বে ইউরিয়া উপরিপ্রয়োগ",
                "title_en": "Urea Top Dressing before Flowering",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (বাকি অর্ধেক)", "key": "urea", "ratio": 0.5, "unit": "কেজি"}
                ],
                "instructions_bn": "বপনের ২৫-৩০ দিন পর প্রথম হালকা সেচের পর মাটিতে 'জো' আসলে বাকি অর্ধেক ইউরিয়া ছিটান।"
            }
        ],
        "spray_plan": [
            {
                "task_id": "mus_spray_1",
                "day": 32,
                "title_bn": "১ম প্রধান স্প্রে: জাবপোকা (Aphids) ও অলটারনারিয়া ব্লাইট দমন",
                "title_en": "1st Spray: Aphid & Alternaria Blight",
                "type": "spray",
                "target_pest_bn": "সরিষার জাবপোকা ও পাতার কালো দাগ রোগ",
                "medicines_bn": "ইমিটাফ ২০ এসএল (ইমিডাক্লোপ্রিড) অথবা এডমায়ার + রোভরাল ৫০ ডব্লিউপি",
                "dosage_bn": "ইমিটাফ: ০.৫ মিলি/লিটার + রোভরাল: ২ গ্রাম/লিটার পানি",
                "instructions_bn": "সরিষার সবচেয়ে বড় শত্রু জাবপোকা। স্প্রে করার সময় অবশ্যই বিকেল ৩টার পর করুন যাতে উপকারী মৌমাছির ক্ষতি না হয়।"
            },
            {
                "task_id": "mus_spray_2",
                "day": 48,
                "title_bn": "২য় স্প্রে: পড গঠন ও দানা ঝরা রোধে অণুখাদ্য স্প্রে",
                "title_en": "2nd Spray: Pod Development & Boron",
                "type": "spray",
                "target_pest_bn": "ফুল ঝরা রোধ ও দানা পূর্ণাঙ্গ গঠন",
                "medicines_bn": "সোলোবর বোরন (Solubor Boron)",
                "dosage_bn": "১.৫ গ্রাম প্রতি লিটার পানি",
                "instructions_bn": "ফুল শেষ হয়ে পড ধরার সময় বোরন স্প্রে করলে কোনো দানা চিটা বা অপুষ্ট থাকে না।"
            }
        ],
        "irrigation_plan": [
            {"day": 0, "title_bn": "রসালো মাটিতে বপন"},
            {"day": 25, "title_bn": "১ম হালকা সেচ (ফুল ফোটার পূর্বে - সেচ অতিরিক্ত হলে চারা পচবে)"},
            {"day": 50, "title_bn": "২য় হালকা সেচ (দানায় দুধ আসা পর্যায়)"}
        ]
    },
    "maize": {
        "id": "maize",
        "name_bn": "ভুট্টা",
        "name_en": "Maize / Corn",
        "popular_varieties": ["এনকে ৪০ (NK40)", "সুপার শাইন", "পায়োনিয়ার ৩৩৫৫", "প্যাসিফিক ৯৮৪", "বারি ভুট্টা-৯"],
        "duration_days": 130,
        "base_unit": "bigha",
        "stages": [
            {"id": "s1", "start_day": 0, "end_day": 15, "name_bn": "বীজ বপন ও অঙ্কুরোদগম", "name_en": "Emergence", "desc_bn": "চারা মাটি ভেদ করে বের হওয়া"},
            {"id": "s2", "start_day": 16, "end_day": 35, "name_bn": "প্রাথমিক বৃদ্ধি (হাঁটু সমান উচ্চতা)", "name_en": "V6 Knee High", "desc_bn": "৬-৮ পাতার দশা ও দ্রুত কাণ্ড বৃদ্ধি"},
            {"id": "s3", "start_day": 36, "end_day": 60, "name_bn": "কোমর সমান উচ্চতা ও দ্রুত বৃদ্ধি", "name_en": "V12 Waist High", "desc_bn": "গাছ শক্ত ও পাতার বিস্তার"},
            {"id": "s4", "start_day": 61, "end_day": 80, "name_bn": "পুরুষ ফুল (ট্যাসেল) ও সিল্ক বের হওয়া", "name_en": "Tasseling & Silking", "desc_bn": "পরাগায়ন ও মোচার গোড়ায় সিল্ক আসা"},
            {"id": "s5", "start_day": 81, "end_day": 105, "name_bn": "মোচায় দুধ ও দানা শক্ত হওয়া", "name_en": "Grain Filling", "desc_bn": "মোচায় ভুট্টার দানা দুধ থেকে শক্ত হওয়া"},
            {"id": "s6", "start_day": 106, "end_day": 130, "name_bn": "পরিপক্বতা ও মোচা সংগ্রহ", "name_en": "Physiological Maturity", "desc_bn": "মোচার খোসা শুকিয়ে বাদামী হলে সংগ্রহ"}
        ],
        "base_fertilizer_per_bigha": {
            "urea": 45.0,
            "tsp": 32.0,
            "mop": 25.0,
            "gypsum": 22.0,
            "zinc_sulfate": 1.5,
            "boron": 1.0
        },
        "fertilizer_plan": [
            {
                "task_id": "mz_fert_basal",
                "day": 0,
                "title_bn": "জমি তৈরির শেষ চাষে সার প্রয়োগ",
                "title_en": "Basal Fertilizer at Sowing",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "টিএসপি / ডিএপি", "key": "tsp", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ - এক তৃতীয়াংশ)", "key": "mop", "ratio": 0.33, "unit": "কেজি"},
                    {"name_bn": "জিপসাম", "key": "gypsum", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "জিংক ও বোরন", "key": "zinc_sulfate", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "ইউরিয়া (এক তৃতীয়াংশ)", "key": "urea", "ratio": 0.33, "unit": "কেজি"}
                ],
                "instructions_bn": "ভুট্টা প্রচুর সার গ্রহণ করে। শেষ চাষে সমস্ত টিএসপি, জিপসাম, জিংক এবং ইউরিয়া ও পটাশের ১/৩ ভাগ দিন।"
            },
            {
                "task_id": "mz_fert_top_1",
                "day": 28,
                "title_bn": "১ম কিস্তি সার (হাঁটু সমান উচ্চতায় - ৫-৬ পাতা)",
                "title_en": "1st Top Dressing (Knee High)",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (২য় ভাগ)", "key": "urea", "ratio": 0.33, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ - ২য় ভাগ)", "key": "mop", "ratio": 0.33, "unit": "কেজি"}
                ],
                "instructions_bn": "গাছের গোড়া থেকে ৫-৬ ইঞ্চি দূরে রিং করে সার দিন এবং সেচ দিন।"
            },
            {
                "task_id": "mz_fert_top_2",
                "day": 55,
                "title_bn": "২য় কিস্তি সার (পুরুষ ফুল বের হওয়ার মুখে)",
                "title_en": "2nd Top Dressing (Pre-Tasseling)",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (শেষ ভাগ)", "key": "urea", "ratio": 0.34, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ - শেষ ভাগ)", "key": "mop", "ratio": 0.34, "unit": "কেজি"}
                ],
                "instructions_bn": "মোচা বড় হওয়ার জন্য এই সার ও সেচ সবচেয়ে গুরুত্বপূর্ণ।"
            }
        ],
        "spray_plan": [
            {
                "task_id": "mz_spray_1",
                "day": 20,
                "title_bn": "১ম জরুরি স্প্রে: ফল আর্মিওয়ার্ম (Fall Armyworm) দমন",
                "title_en": "1st Spray: Fall Armyworm Prevention",
                "type": "spray",
                "target_pest_bn": "ফল আর্মিওয়ার্ম পোকা (ভুট্টার পাতা ও ডগা কুরে কুরে খায়)",
                "medicines_bn": "স্পাইনোস্যাড (ট্রেসার ৪৫ এসসি) অথবা এমামেক্টিন বেনজোয়েট (প্রোক্লেম ৫ এসজি)",
                "dosage_bn": "ট্রেসার: ০.৪ মিলি/লিটার অথবা প্রোক্লেম: ১ গ্রাম/লিটার পানি",
                "instructions_bn": "গাছের পাতার চোঙার (কোরলের) ভেতরে ওষুধ যাতে পড়ে সেভাবে স্প্রে করুন।"
            },
            {
                "task_id": "mz_spray_2",
                "day": 50,
                "title_bn": "২য় স্প্রে: পাতা পোড়া (Leaf Blight) রোগ প্রতিরোধ",
                "title_en": "2nd Spray: Turcicum Leaf Blight",
                "type": "spray",
                "target_pest_bn": "ভুট্টার টার্সিকাম পাতা পোড়া রোগ",
                "medicines_bn": "টিল্ট ২৫০ ইসি (Tilt) অথবা স্কোর ২৫০ ইসি",
                "dosage_bn": "০.৫ মিলি প্রতি লিটার পানি",
                "instructions_bn": "পাতায় নৌকা আকৃতির বাদামী দাগ দেখলে স্প্রে করুন।"
            }
        ],
        "irrigation_plan": [
            {"day": 25, "title_bn": "১ম সেচ (হাঁটু সমান উচ্চতায় সার দেওয়ার পর)"},
            {"day": 55, "title_bn": "২য় সেচ (ট্যাসেল বের হওয়ার সময় - অত্যন্ত সংবেদনশীল)"},
            {"day": 80, "title_bn": "৩য় সেচ (মোচায় দানা গঠন পর্যায়)"}
        ]
    },
    "wheat": {
        "id": "wheat",
        "name_bn": "গম",
        "name_en": "Wheat",
        "popular_varieties": ["বারি গম ৩৩ (ব্লাস্ট প্রতিরোধী)", "বারি গম ২৮", "বারি গম ৩০", "শতাব্দী", "সৌরভ"],
        "duration_days": 105,
        "base_unit": "bigha",
        "stages": [
            {"id": "s1", "start_day": 0, "end_day": 15, "name_bn": "বীজ গজানো ও চারা অবস্থা", "name_en": "Crown Root Initiation", "desc_bn": "শিকড় মাটির নিচে বসা"},
            {"id": "s2", "start_day": 16, "end_day": 35, "name_bn": "কুশি গজানো পর্যায়", "name_en": "Tillering", "desc_bn": "কুশি বৃদ্ধি পাওয়া"},
            {"id": "s3", "start_day": 36, "end_day": 55, "name_bn": "শীষ বের হওয়া (Heading)", "name_en": "Heading", "desc_bn": "গমের শীষ ফোটা"},
            {"id": "s4", "start_day": 56, "end_day": 80, "name_bn": "দানা দুধ ও শক্ত হওয়া", "name_en": "Milking & Dough", "desc_bn": "দানার ওজন বৃদ্ধি"},
            {"id": "s5", "start_day": 81, "end_day": 105, "name_bn": "পরিপক্বতা ও কর্তন", "name_en": "Maturity", "desc_bn": "সোনালী রঙের শীষ হলে কর্তন"}
        ],
        "base_fertilizer_per_bigha": {
            "urea": 28.0,
            "tsp": 20.0,
            "mop": 12.0,
            "gypsum": 15.0,
            "zinc_sulfate": 1.0,
            "boron": 1.0
        },
        "fertilizer_plan": [
            {
                "task_id": "wh_fert_basal",
                "day": 0,
                "title_bn": "জমি তৈরির শেষ চাষে সার প্রয়োগ",
                "title_en": "Basal Application",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "টিএসপি / ডিএপি", "key": "tsp", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ)", "key": "mop", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "জিপসাম ও বোরন", "key": "gypsum", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "ইউরিয়া (দুই তৃতীয়াংশ)", "key": "urea", "ratio": 0.67, "unit": "কেজি"}
                ],
                "instructions_bn": "দুই তৃতীয়াংশ ইউরিয়া এবং সমস্ত টিএসপি, পটাশ, জিপসাম শেষ চাষে দিন।"
            },
            {
                "task_id": "wh_fert_top_1",
                "day": 20,
                "title_bn": "১ম কিস্তি ইউরিয়া উপরিপ্রয়োগ (ক্রাউন রুট গজানোর সময়)",
                "title_en": "Top Dressing at CRI Stage",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (বাকি এক তৃতীয়াংশ)", "key": "urea", "ratio": 0.33, "unit": "কেজি"}
                ],
                "instructions_bn": "প্রথম সেচের পর মাটিতে 'জো' আসলে বাকি ইউরিয়া ছিটান।"
            }
        ],
        "spray_plan": [
            {
                "task_id": "wh_spray_1",
                "day": 45,
                "title_bn": "১ম সতর্কতামূলক স্প্রে: গমের মারাত্মক ব্লাস্ট রোগ প্রতিরোধ",
                "title_en": "Wheat Blast Prevention Spray",
                "type": "spray",
                "target_pest_bn": "গমের ব্লাস্ট রোগ (শীষ সাদা হয়ে চিটা হওয়া)",
                "medicines_bn": "নাটিভো ৭৫ ডব্লিউজি অথবা ফলিকুর ২৫০ ইসি",
                "dosage_bn": "নাটিভো ০.৬ গ্রাম প্রতি লিটার পানি",
                "instructions_bn": "শীষ বের হওয়ার মুখে ব্লাস্ট প্রতিরোধী স্প্রে আবশ্যক।"
            }
        ],
        "irrigation_plan": [
            {"day": 20, "title_bn": "১ম গুরুত্বপূর্ণ সেচ (CRI পর্যায় - চারা লাগানোর ১৭-২১ দিন)"},
            {"day": 50, "title_bn": "২য় সেচ (শীষ বের হওয়া পর্যায়)"},
            {"day": 75, "title_bn": "৩য় সেচ (দানা শক্ত হওয়া পর্যায়)"}
        ]
    },
    "tomato": {
        "id": "tomato",
        "name_bn": "টমেটো",
        "name_en": "Tomato",
        "popular_varieties": ["বিজলী", "বাহার", "রতন", "সফল", "মিন্টু সুপার", "বিউটি"],
        "duration_days": 110,
        "base_unit": "bigha",
        "stages": [
            {"id": "s1", "start_day": 0, "end_day": 15, "name_bn": "চারা রোপণ ও স্থাপন", "name_en": "Transplanting", "desc_bn": "বেডে চারা প্রতিষ্ঠা পাওয়া"},
            {"id": "s2", "start_day": 16, "end_day": 35, "name_bn": "ডালপালা বৃদ্ধি ও শাখা বিস্তার", "name_en": "Branching", "desc_bn": "খুঁটি বাঁধা ও ডালপালা বৃদ্ধি"},
            {"id": "s3", "start_day": 36, "end_day": 55, "name_bn": "ফুল ফোটা ও ফল ধরা শুরু", "name_en": "Flowering & Fruit Set", "desc_bn": "হলুদ ফুল ও কচি টমেটো"},
            {"id": "s4", "start_day": 56, "end_day": 85, "name_bn": "ফল বৃদ্ধি ও পাকা শুরু", "name_en": "Fruit Sizing", "desc_bn": "টমেটোর আকার বৃদ্ধি"},
            {"id": "s5", "start_day": 86, "end_day": 110, "name_bn": "নিয়মিত টমেটো সংগ্রহ", "name_en": "Harvesting", "desc_bn": "লাল পাকা টমেটো সংগ্রহ"}
        ],
        "base_fertilizer_per_bigha": {
            "urea": 35.0,
            "tsp": 30.0,
            "mop": 25.0,
            "gypsum": 15.0,
            "zinc_sulfate": 1.0,
            "boron": 1.2,
            "cowdung": 1000.0
        },
        "fertilizer_plan": [
            {
                "task_id": "tom_fert_basal",
                "day": 0,
                "title_bn": "জমি ও মাদা তৈরিতে সার প্রয়োগ",
                "title_en": "Basal Application",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "পচা গোবর", "key": "cowdung", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "টিএসপি", "key": "tsp", "ratio": 1.0, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ - এক তৃতীয়াংশ)", "key": "mop", "ratio": 0.33, "unit": "কেজি"},
                    {"name_bn": "বোরন ও জিপসাম", "key": "boron", "ratio": 1.0, "unit": "কেজি"}
                ],
                "instructions_bn": "মাদায় গোবর, টিএসপি, বোরন মিশিয়ে চারা রোপণ করুন।"
            },
            {
                "task_id": "tom_fert_top_1",
                "day": 20,
                "title_bn": "১ম কিস্তি ইউরিয়া ও পটাশ উপরিপ্রয়োগ",
                "title_en": "1st Top Dressing",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (অর্ধেক)", "key": "urea", "ratio": 0.5, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ - ২য় ভাগ)", "key": "mop", "ratio": 0.33, "unit": "কেজি"}
                ],
                "instructions_bn": "গাছের গোড়া থেকে দূরে রিং আকারে দিয়ে মাটি তুলে সেচ দিন।"
            },
            {
                "task_id": "tom_fert_top_2",
                "day": 45,
                "title_bn": "২য় কিস্তি সার (ফুল ও ফল ধরার সময়)",
                "title_en": "2nd Top Dressing",
                "type": "fertilizer",
                "items": [
                    {"name_bn": "ইউরিয়া (বাকি অর্ধেক)", "key": "urea", "ratio": 0.5, "unit": "কেজি"},
                    {"name_bn": "এমওপি (পটাশ - শেষ ভাগ)", "key": "mop", "ratio": 0.34, "unit": "কেজি"}
                ],
                "instructions_bn": "টমেটো বড় করার জন্য পটাশ সার অত্যন্ত উপযোগী।"
            }
        ],
        "spray_plan": [
            {
                "task_id": "tom_spray_1",
                "day": 25,
                "title_bn": "১ম স্প্রে: সাদা মাছি ও পাতা কোঁকড়ানো ভাইরাস দমন",
                "title_en": "Whitefly & Leaf Curl Virus Control",
                "type": "spray",
                "target_pest_bn": "সাদা মাছি (ভাইরাস বাহক) ও আগাম ধসা",
                "medicines_bn": "অ্যাডমায়ার / ইমিটাফ + ডাইথেন এম-৪৫",
                "dosage_bn": "ইমিটাফ ০.৫ মিলি/লিটার + ডাইথেন ২ গ্রাম/লিটার পানি",
                "instructions_bn": "পাতার নিচের দিকে স্প্রে করুন।"
            },
            {
                "task_id": "tom_spray_2",
                "day": 45,
                "title_bn": "২য় স্প্রে: ফল ছিদ্রকারী পোকা ও ফল পচা রোগ দমন",
                "title_en": "Fruit Borer & Blossom End Rot",
                "type": "spray",
                "target_pest_bn": "ফল ছিদ্রকারী পোকা ও বোরন ঘাটতি (ফল ফাটা)",
                "medicines_bn": "প্রোক্লেম ৫ এসজি + সোলোবর বোরন ও চিলেটেড ক্যালসিয়াম",
                "dosage_bn": "প্রোক্লেম ১ গ্রাম/লিটার + বোরন ১.৫ গ্রাম/লিটার পানি",
                "instructions_bn": "টমেটো ফাটা বন্ধ করতে বোরন ও ক্যালসিয়াম স্প্রে ম্যাজিকের মতো কাজ করে।"
            }
        ],
        "irrigation_plan": [
            {"day": 0, "title_bn": "রোপণের সাথে সাথে হালকা পানি"},
            {"day": 15, "title_bn": "৭-১০ দিন অন্তর নিয়মিত সেচ (নালা পদ্ধতিতে)"},
            {"day": 60, "title_bn": "ফল ধরার সময় আর্দ্রতা সমভাবে বজায় রাখুন (অনাবৃষ্টির পর হঠাৎ ভারী সেচে টমেটো ফেটে যায়)"}
        ]
    }
}

# Soil Type Adjustment Factors
SOIL_ADJUSTMENTS = {
    "দোআঁশ মাটি": {
        "tag": "loam",
        "name_bn": "দোআঁশ মাটি (Loamy Soil)",
        "urea_split_count": 3,
        "urea_factor": 1.0,
        "mop_factor": 1.0,
        "irrigation_note_bn": "আদর্শ মাটি। পানি ধারণ ও নিষ্কাশন সুষম। নির্ধারিত রুটিন অনুযায়ী সেচ ও সার দিন।"
    },
    "বেলে-দোআঁশ মাটি": {
        "tag": "sandy_loam",
        "name_bn": "বেলে-দোআঁশ মাটি (Sandy Loam)",
        "urea_split_count": 4,
        "urea_factor": 1.05,
        "mop_factor": 1.10,
        "irrigation_note_bn": "পানি ও সার দ্রুত নিচে চুইয়ে যায় (Leaching)। ইউরিয়া সার ৩ কিস্তির পরিবর্তে ৪ কিস্তিতে ভাগ করে অল্প অল্প প্রয়োগ করুন। পটাশ সার ১০% বৃদ্ধি করুন।"
    },
    "বেলে মাটি": {
        "tag": "sandy",
        "name_bn": "বেলে মাটি (Sandy Soil)",
        "urea_split_count": 4,
        "urea_factor": 1.10,
        "mop_factor": 1.15,
        "irrigation_note_bn": "পানি দ্রুত শুকিয়ে যায়। ঘন ঘন হালকা সেচ দিন। গোবর/কম্পোস্ট বেশি ব্যবহার করুন এবং ইউরিয়া সার কিস্তিতে ভাগ করে দিন।"
    },
    "এঁটেল মাটি": {
        "tag": "clay",
        "name_bn": "এঁটেল মাটি (Clay Soil)",
        "urea_split_count": 2,
        "urea_factor": 0.95,
        "mop_factor": 1.0,
        "irrigation_note_bn": "পানি জমে থাকার প্রবণতা বেশি। নিষ্কাশন নালা সবসময় পরিষ্কার রাখুন। মাটি কিছুটা শুকিয়ে 'জো' আসলে সার দিয়ে হালকা নিড়ানি দিন।"
    },
    "পলি মাটি": {
        "tag": "silt",
        "name_bn": "পলি মাটি (Silt Soil)",
        "urea_split_count": 3,
        "urea_factor": 1.0,
        "mop_factor": 1.0,
        "irrigation_note_bn": "উর্বর প্রাকৃতিক পলিমাটি। পরিমিত সারেই চমৎকার ফলন পাওয়া যায়।"
    }
}

class CropCareAdvisorService:
    @staticmethod
    def get_supported_crops():
        return [
            {
                "id": k,
                "name_bn": v["name_bn"],
                "name_en": v["name_en"],
                "duration_days": v["duration_days"],
                "popular_varieties": v["popular_varieties"]
            }
            for k, v in CROP_DATABASE.items()
        ]

    @staticmethod
    def normalize_crop_id(crop_query: str) -> str:
        if not crop_query:
            return "aman_rice"
        q = crop_query.lower()
        if "boro" in q or "বোরো" in q:
            return "boro_rice"
        if "aman" in q or "আমন" in q or "ধান" in q:
            return "aman_rice"
        if "potato" in q or "আলু" in q:
            return "potato"
        if "mustard" in q or "সরিষা" in q:
            return "mustard"
        if "maize" in q or "corn" in q or "ভুট্টা" in q:
            return "maize"
        if "wheat" in q or "গম" in q:
            return "wheat"
        if "tomato" in q or "টমেটো" in q:
            return "tomato"
        return "aman_rice"

    @staticmethod
    def calculate_land_factor(area_val: float, area_unit: str) -> float:
        """Calculates area multiplier normalized to 1 Bigha (33 decimals)"""
        val = float(area_val) if area_val else 1.0
        unit = (area_unit or "bigha").lower()
        if unit in ["bigha", "বিঘা"]:
            return max(0.1, val)
        elif unit in ["decimal", "shatak", "শতক", "শতাংশ"]:
            return max(0.1, val / 33.0)
        elif unit in ["katha", "কাঠা"]:
            return max(0.1, (val * 1.65) / 33.0)
        elif unit in ["acre", "একর"]:
            return max(0.1, (val * 100.0) / 33.0)
        elif unit in ["hectare", "হেক্টর"]:
            return max(0.1, (val * 247.1) / 33.0)
        return max(0.1, val)

    @classmethod
    def generate_crop_advisory(
        cls,
        crop_name: str,
        planting_date_str: str,
        crop_variety: Optional[str] = "",
        soil_type: Optional[str] = "দোআঁশ মাটি",
        area_value: float = 1.0,
        area_unit: str = "bigha",
        irrigation_source: Optional[str] = "গভীর নলকূপ",
        completed_tasks_list: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        crop_id = cls.normalize_crop_id(crop_name)
        crop_data = CROP_DATABASE.get(crop_id, CROP_DATABASE["aman_rice"])

        # Sowing Date parse
        try:
            planting_dt = datetime.strptime(planting_date_str.strip()[:10], "%Y-%m-%d")
        except Exception:
            planting_dt = datetime.utcnow()
        
        today = datetime.utcnow()
        das = (today.date() - planting_dt.date()).days # Days after sowing

        # Area scale
        land_factor = cls.calculate_land_factor(area_value, area_unit)
        total_decimals = round(land_factor * 33.0, 1)

        # Soil factor
        soil_key = "দোআঁশ মাটি"
        for k in SOIL_ADJUSTMENTS.keys():
            if k in (soil_type or ""):
                soil_key = k
                break
        soil_info = SOIL_ADJUSTMENTS.get(soil_key, SOIL_ADJUSTMENTS["দোআঁশ মাটি"])

        # Determine current stage
        current_stage = None
        stages_output = []
        for stg in crop_data["stages"]:
            is_active = (stg["start_day"] <= das <= stg["end_day"])
            is_past = das > stg["end_day"]
            if is_active:
                current_stage = stg
            
            stage_start_date = planting_dt + timedelta(days=stg["start_day"])
            stage_end_date = planting_dt + timedelta(days=stg["end_day"])

            stages_output.append({
                **stg,
                "is_current": is_active,
                "is_completed": is_past,
                "start_date": stage_start_date.strftime("%Y-%m-%d"),
                "end_date": stage_end_date.strftime("%Y-%m-%d")
            })

        if not current_stage:
            if das < 0:
                current_stage = {
                    "name_bn": "রোপণ প্রস্তুতি পর্ব",
                    "name_en": "Pre-Sowing Preparation",
                    "desc_bn": f"চারা রোপণের এখনও {abs(das)} দিন বাকি রয়েছে। জমি চাষ ও সার সংগ্রহ করুন।"
                }
            else:
                current_stage = {
                    "name_bn": "ফসল কর্তন সম্পন্ন",
                    "name_en": "Post Harvest",
                    "desc_bn": "ফসল পরিপক্বতা পেরিয়ে গেছে বা কর্তন সম্পন্ন হয়েছে।"
                }

        completed_set = set(completed_tasks_list or [])

        # Total fertilizer scaled calculation
        total_fertilizers = {}
        for fert_key, base_kg in crop_data["base_fertilizer_per_bigha"].items():
            multiplier = land_factor
            if fert_key == "urea":
                multiplier *= soil_info["urea_factor"]
            elif fert_key == "mop":
                multiplier *= soil_info["mop_factor"]
            total_fertilizers[fert_key] = round(base_kg * multiplier, 1)

        # Build Dynamic Fertilizer Timeline
        fertilizer_timeline = []
        for plan in crop_data["fertilizer_plan"]:
            action_dt = planting_dt + timedelta(days=plan["day"])
            days_from_now = (action_dt.date() - today.date()).days
            
            # calculate exact kg for each item
            computed_items = []
            for item in plan["items"]:
                k = item["key"]
                base_tot = total_fertilizers.get(k, 10.0)
                amount = round(base_tot * item["ratio"], 1)
                computed_items.append({
                    "name_bn": item["name_bn"],
                    "amount_kg": amount,
                    "unit": item["unit"]
                })

            is_done = plan["task_id"] in completed_set
            status = "completed" if is_done else ("overdue" if days_from_now < 0 else ("today" if days_from_now == 0 else "upcoming"))

            fertilizer_timeline.append({
                "task_id": plan["task_id"],
                "day_after_sowing": plan["day"],
                "target_date": action_dt.strftime("%Y-%m-%d"),
                "days_remaining": days_from_now,
                "title_bn": plan["title_bn"],
                "title_en": plan["title_en"],
                "type": "fertilizer",
                "items": computed_items,
                "instructions_bn": plan["instructions_bn"],
                "is_completed": is_done,
                "status": status
            })

        # Build Dynamic Spray Timeline
        spray_timeline = []
        # Approximate water required: 55 liters per bigha
        total_water_liters = round(land_factor * 55.0)

        for plan in crop_data["spray_plan"]:
            action_dt = planting_dt + timedelta(days=plan["day"])
            days_from_now = (action_dt.date() - today.date()).days
            is_done = plan["task_id"] in completed_set
            status = "completed" if is_done else ("overdue" if days_from_now < 0 else ("today" if days_from_now == 0 else "upcoming"))

            spray_timeline.append({
                "task_id": plan["task_id"],
                "day_after_sowing": plan["day"],
                "target_date": action_dt.strftime("%Y-%m-%d"),
                "days_remaining": days_from_now,
                "title_bn": plan["title_bn"],
                "title_en": plan["title_en"],
                "type": "spray",
                "target_pest_bn": plan["target_pest_bn"],
                "medicines_bn": plan["medicines_bn"],
                "dosage_bn": plan["dosage_bn"],
                "water_liters_recommended": total_water_liters,
                "instructions_bn": plan["instructions_bn"],
                "is_completed": is_done,
                "status": status
            })

        # Combined Action Timeline ordered chronologically
        all_actions = fertilizer_timeline + spray_timeline
        all_actions.sort(key=lambda x: x["day_after_sowing"])

        # Find next immediate action
        next_action = None
        for act in all_actions:
            if not act["is_completed"] and act["days_remaining"] >= -2:
                next_action = act
                break
        if not next_action:
            # find first uncompleted or fallback to last
            uncompleted = [a for a in all_actions if not a["is_completed"]]
            next_action = uncompleted[0] if uncompleted else (all_actions[-1] if all_actions else None)

        total_tasks_count = len(all_actions)
        completed_tasks_count = len([a for a in all_actions if a["is_completed"]])
        completion_percentage = int((completed_tasks_count / total_tasks_count * 100)) if total_tasks_count > 0 else 0

        # Audio summary script in natural Bangla
        audio_script = (
            f"আপনার {crop_data['name_bn']} ফসলের বয়স আজ {das} দিন। "
            f"বর্তমান পর্যায়: {current_stage['name_bn']}। "
        )
        if next_action:
            if next_action['days_remaining'] > 0:
                audio_script += f"পরবর্তী কাজ: আর {next_action['days_remaining']} দিন পর {next_action['title_bn']}। "
            elif next_action['days_remaining'] == 0:
                audio_script += f"আজকের করণীয়: {next_action['title_bn']}। "
            else:
                audio_script += f"সতর্কতা: {next_action['title_bn']} সম্পন্ন করুন। "
        audio_script += f"{soil_info['name_bn']} এর কারণে {soil_info['irrigation_note_bn']}"

        return {
            "crop": {
                "id": crop_id,
                "name_bn": crop_data["name_bn"],
                "name_en": crop_data["name_en"],
                "crop_variety": crop_variety or "উন্নত অনুমোদিত জাত",
                "duration_days": crop_data["duration_days"]
            },
            "planting_info": {
                "planting_date": planting_dt.strftime("%Y-%m-%d"),
                "days_after_sowing": das,
                "current_stage": current_stage,
                "stages": stages_output,
                "area_value": area_value,
                "area_unit": area_unit,
                "total_decimals": total_decimals,
                "total_bigha": round(land_factor, 2),
                "soil_type": soil_key,
                "soil_advice": soil_info,
                "irrigation_source": irrigation_source or "গভীর নলকূপ"
            },
            "total_fertilizer_requirement": total_fertilizers,
            "fertilizer_timeline": fertilizer_timeline,
            "spray_timeline": spray_timeline,
            "all_actions": all_actions,
            "next_action": next_action,
            "irrigation_plan": crop_data.get("irrigation_plan", []),
            "progress": {
                "total_tasks": total_tasks_count,
                "completed_tasks": completed_tasks_count,
                "percentage": completion_percentage
            },
            "audio_summary_bn": audio_script
        }
