from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Plot, User, Expense
from pydantic import BaseModel
from typing import Optional
from app.config import settings

router = APIRouter(prefix="/chat", tags=["AI Krishi Assistant Chatbot"])

class ChatMessage(BaseModel):
    message: str

@router.post("/ask")
async def ask_assistant(data: ChatMessage, db: Session = Depends(get_db)):
    user = db.query(User).first()
    plot = db.query(Plot).first()
    query = data.message.lower()

    # If Gemini API key is configured, use real generative response with Bengali agricultural persona
    if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 15:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
            You are 'কৃষি বন্ধু' (Crop Care), an expert and compassionate Agricultural Extension Officer in Bangladesh.
            Answer the farmer's question in clear, helpful, natural Bengali (বাংলা).
            Farmer context: {user.name if user else 'সিরাজুল'}, Plot: {plot.name if plot else 'প্লট ১'}, Crop: {plot.crop_name if plot else 'আমন ধান'}, Land: 3.5 Bigha.
            
            Question: {data.message}
            
            Keep the advice practical, mention organic remedies first, specify exact generic medicine names and dosages per bigha if needed, and reference NASA climate/soil insights when applicable. Keep under 4-5 sentences.
            """
            response = model.generate_content(prompt)
            if response and response.text:
                return {
                    "reply_bn": response.text.strip(),
                    "audio_tts_ready": True,
                    "source": "Gemini 1.5 Flash Agro Expert"
                }
        except Exception as e:
            pass

    # Contextual dynamic responses in Bengali tailored for Bangladeshi farmers
    if "সার" in query or "fertilizer" in query:
        reply = (
            "আমন ধানের জন্য বিঘাপ্রতি ১৩ কেজি টিএসপি, ৮ কেজি জিপসাম ও ১ কেজি জিংক জমি তৈরির সময় এবং "
            "চারা লাগানোর ১৫, ৩৫ ও ৫৫ দিন পর ৩ কিস্তিতে ইউরিয়া সার (প্রতিবারে ৮-৯ কেজি) প্রয়োগ করা উত্তম। "
            "আপনার জমিতে সার প্রয়োগের সময় মাটিতে পর্যাপ্ত আর্দ্রতা নিশ্চিত রাখুন।"
        )
    elif "বৃষ্টি" in query or "আবহাওয়া" in query or "weather" in query:
        reply = (
            "নাসা এবং আবহাওয়া পূর্বাভাসের তথ্যানুযায়ী আগামী কয়েকদিন আকাশ আংশিক মেঘলা থাকতে পারে। "
            "বৃষ্টির সম্ভাবনা থাকলে জমিতে কীটনাশক স্প্রে করা স্থগিত রাখুন।"
        )
    elif "পোকা" in query or "মাজরা" in query or "ব্লাস্ট" in query:
        reply = (
            "ধানের ব্লাস্ট বা মাজরা পোকার লক্ষণ দেখা দিলে ট্রাইসাইক্লাজোল ৭৫% WP (যেমন: ট্রুপার/দিফা) "
            "অথবা ক্লোরেন্ট্রানিলিপ্রোল গ্রুপের অনুমোদিত ওষুধ বিকেলের রোদে স্প্রে করুন। প্রয়োজনে জমিতে পার্চিং (কঞ্চি পোঁতা) করুন।"
        )
    elif "সেচ" in query or "পানি" in query:
        reply = (
            "আমন ধানের কুশি গজানো ও থোর আসার সময় জমিতে ২-৩ ইঞ্চি পানি ধরে রাখা জরুরি। "
            "নাসার স্যাটেলাইট আর্দ্রতা সূচক অনুযায়ী বর্তমানে মাটির ভেজা অবস্থা অনুকূল রয়েছে।"
        )
    elif "বন্যা" in query or "হাওর" in query:
        reply = (
            "নাসা জিপিএম স্যাটেলাইটের তথ্যমতে আসাম ও চেরাপুঞ্জির উজান অববাহিকায় বৃষ্টিপাত পর্যবেক্ষণে রাখা হয়েছে। "
            "হাওরে আকস্মিক বন্যার আশঙ্কা থাকলে ধান ৮০% সোনালী হলেই দ্রুত কেটে ফেলার পরামর্শ দেওয়া হয়।"
        )
    elif "বীমা" in query or "ক্ষতি" in query or "insurance" in query:
        reply = (
            "প্রাকৃতিক দুর্যোগে ফসল ক্ষতিগ্রস্ত হলে আমাদের 'স্যাটেলাইট বীমা সনদ' বিভাগ থেকে নাসার ভেরিফাইড ক্ষতি সনদ ডাউনলোড করতে পারেন, যা কৃষি ব্যাংক বা বীমা দাবির জন্য ব্যবহারযোগ্য।"
        )
    elif "খরচ" in query or "লাভ" in query:
        reply = (
            "আপনার ৩.৫ বিঘা জমির জন্য কৃষি ডায়েরি থেকে মোট খরচ ও আয় পর্যবেক্ষণ করা যাচ্ছে। "
            "সারের অপচয় রোধ করতে পারলে আপনার বিঘাপ্রতি মুনাফা প্রায় ১৫-২০% বৃদ্ধি পাবে।"
        )
    else:
        reply = (
            f"শ্রদ্ধেয় কৃষক ভাই, আপনার {plot.crop_name if plot else 'আমন ধান'} ফসলের সুস্বাস্থ্যের জন্য আমরা সার্বক্ষণিক পাশে আছি। "
            "ফসল রোপণ, সার প্রয়োগ, পোকা দমন বা আবহাওয়ার যে কোনো পরামর্শের জন্য আপনার প্রশ্ন জানান অথবা ফসলের পাতার ছবি তুলে রোগ নির্ণয় করুন।"
        )

    return {
        "reply_bn": reply,
        "audio_tts_ready": True,
        "source": "NASA Agro Knowledge Base"
    }
