from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/ai-chatbot", tags=["AI Health Chatbot"])

class ChatQuery(BaseModel):
    message: str
    language: Optional[str] = "en"  # "en", "as" (Assamese), "bn" (Bengali), "hi" (Hindi)
    district_name: Optional[str] = "Kamrup Metropolitan"

@router.post("/query")
def chat_with_arogya_ai(query: ChatQuery):
    msg = query.message.lower()
    lang = query.language

    # Multilingual Responses Dictionary
    if "cholera" in msg or "diarrhea" in msg or "vomit" in msg or "ডায়ৰিয়া" in msg:
        if lang == "as":
            reply = "কলৰা বা ডায়ৰিয়া প্ৰতিৰোধৰ বাবে সদায় পানী উতলাই খাব। অ’ আৰ এছ (ORS)ৰ দ্ৰৱ ব্যৱহাৰ কৰক। ওচৰৰ স্বাস্থ্য কেন্দ্ৰ: সোণাপুৰ প্ৰাথমিক স্বাস্থ্য কেন্দ্ৰ।"
        elif lang == "hi":
            reply = "हैजा (Cholera) या दस्त की स्थिति में उबला हुआ पानी पीएं और तुरंत ORS घोल लें। नजदीकी प्राथमिक स्वास्थ्य केंद्र से संपर्क करें।"
        else:
            reply = "For Cholera or Diarrhea symptoms: 1) Drink boiled water only. 2) Administer Oral Rehydration Salts (ORS) immediately. 3) Avoid raw street food. Nearest health facility: Sonapur PHC (+91-361-2890123)."
    elif "water" in msg or "turbid" in msg or "contamination" in msg or "পানী" in msg:
        if lang == "as":
            reply = "যদি খোৱাপানী ঘোলা বা দূষিত হয়, তেন্তে হেলাজোন (Halazone) টেবলেট বা ব্লিচিং পাউডাৰ ব্যৱহাৰ কৰক। এশা (ASHA) কৰ্মীক খবৰ দিয়ক।"
        elif lang == "hi":
            reply = "अगर पानी गंदा या दूषित लग रहा है, तो पानी को 10 मिनट तक उबालें या हैलाजोन गोलियों का उपयोग करें।"
        else:
            reply = "Water Contamination Guidelines: Boil drinking water vigorously for at least 10 minutes or use 1 Halazone tablet per 20 liters. Report contaminated tube wells via the Citizen Portal!"
    elif "hospital" in msg or "phc" in msg or "doctor" in msg or "ডাক্তৰ" in msg:
        reply = "Active Medical Facilities in Kamrup Metro: 1) Sonapur PHC (Available Beds: 12). 2) Gauhati Medical College & Hospital (Available Beds: 120, Emergency Helpline: 108)."
    else:
        reply = "Arogya Northeast AI Health Advisory: Welcome! You can ask me about water-borne disease symptoms, water purification methods, nearby health centers, or report a local outbreak."

    return {
        "reply": reply,
        "language_detected": lang,
        "recommended_actions": [
            "Boil drinking water for 10 minutes",
            "Use ORS for hydration",
            "Contact ASHA worker in your village",
            "Emergency Helpline: 108"
        ]
    }
