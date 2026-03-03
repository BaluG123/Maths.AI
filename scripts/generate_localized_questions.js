#!/usr/bin/env node
/**
 * generate_localized_questions.js
 * 
 * Reads questions.json and generates localized_questions.json with translations
 * for all supported languages. Numbers stay in 1,2,3,4... format.
 * Options stay unchanged (they are numbers).
 * Only question text, hint, solution label, and explanation text are translated.
 * 
 * Usage: node scripts/generate_localized_questions.js
 */

const fs = require('fs');
const path = require('path');

// Read original questions
const questionsPath = path.join(__dirname, '..', 'src', 'data', 'questions.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

// ─── Translation Dictionaries ───────────────────────────────────────────────
// Common math phrases and their translations
// Numbers and math symbols are preserved as-is

const translations = {
    hi: {
        // Question starters
        'What is the next number in:': 'इस श्रृंखला में अगली संख्या क्या है:',
        'What is the next number in the series:': 'इस श्रृंखला में अगली संख्या क्या है:',
        'What comes next:': 'अगली संख्या क्या है:',
        'Find the next number:': 'अगली संख्या ज्ञात करें:',
        'Find the next:': 'अगला ज्ञात करें:',
        'Find the missing number:': 'लुप्त संख्या ज्ञात करें:',
        'Find:': 'ज्ञात करें:',
        'Complete:': 'पूरा करें:',
        'Next in sequence:': 'क्रम में अगला:',
        'Next number:': 'अगली संख्या:',
        'Next:': 'अगला:',
        'What is next:': 'अगला क्या है:',
        'What is the next term:': 'अगला पद क्या है:',
        // Hints
        'Look at the differences between consecutive numbers': 'क्रमिक संख्याओं के बीच अंतर देखें',
        'Look at the differences between consecutive numbers — they form their own pattern': 'क्रमिक संख्याओं के बीच अंतर देखें — वे अपना पैटर्न बनाते हैं',
        'Each number is the sum of the two preceding ones': 'प्रत्येक संख्या पिछली दो संख्याओं का योग है',
        'Each number is multiplied by the same factor': 'प्रत्येक संख्या को समान गुणांक से गुणा किया गया है',
        'These are perfect squares': 'ये पूर्ण वर्ग हैं',
        'These are perfect cubes': 'ये पूर्ण घन हैं',
        'Differences form a pattern': 'अंतर एक पैटर्न बनाते हैं',
        'Differences are increasing': 'अंतर बढ़ रहे हैं',
        'Each term is double the previous plus 1': 'प्रत्येक पद पिछले का दोगुना जमा 1 है',
        'Sum of the previous three numbers': 'पिछली तीन संख्याओं का योग',
        'These are a special type of numbers': 'ये एक विशेष प्रकार की संख्याएं हैं',
        'Multiply by a constant': 'एक स्थिरांक से गुणा करें',
        'These are factorials': 'ये क्रमगुणित हैं',
        'Triangular numbers': 'त्रिकोणीय संख्याएं',
        'Each number doubles': 'प्रत्येक संख्या दोगुनी होती है',
        'Differences increase by 2': 'अंतर 2 से बढ़ते हैं',
        'Tetrahedral numbers': 'चतुष्फलकीय संख्याएं',
        'Multiply by 3 each time': 'हर बार 3 से गुणा करें',
        'n²-1 pattern': 'n²-1 पैटर्न',
        'Simple arithmetic progression': 'सरल समांतर श्रेणी',
        'Dividing by 2': '2 से भाग',
        // Explanations
        'Differences:': 'अंतर:',
        'next difference is': 'अगला अंतर है',
        'Fibonacci sequence:': 'फिबोनाची श्रृंखला:',
        'Geometric sequence': 'ज्यामितीय श्रृंखला',
        'Perfect squares:': 'पूर्ण वर्ग:',
        'Perfect cubes:': 'पूर्ण घन:',
        'Doubling:': 'दोगुना:',
        'Factorials:': 'क्रमगुणित:',
        'Triangular numbers:': 'त्रिकोणीय संख्याएं:',
        'Prime numbers:': 'अभाज्य संख्याएं:',
        'next prime after': 'के बाद अगला अभाज्य',
        'Adding': 'जोड़ना',
        'each time': 'हर बार',
        'Pattern is': 'पैटर्न है',
        'The differences between consecutive terms increase by': 'क्रमिक पदों के बीच अंतर बढ़ता है',
        'The next difference is': 'अगला अंतर है',
        'giving us': 'जो देता है',
        'so': 'इसलिए',
    },
    ta: {
        'What is the next number in:': 'இந்தத் தொடரில் அடுத்த எண் என்ன:',
        'What is the next number in the series:': 'இந்தத் தொடரில் அடுத்த எண் என்ன:',
        'What comes next:': 'அடுத்தது என்ன:',
        'Find the next number:': 'அடுத்த எண்ணைக் கண்டறியவும்:',
        'Find the next:': 'அடுத்ததைக் கண்டறியவும்:',
        'Find the missing number:': 'விடுபட்ட எண்ணைக் கண்டறியவும்:',
        'Find:': 'கண்டறியவும்:',
        'Complete:': 'நிறைவு செய்யவும்:',
        'Next in sequence:': 'வரிசையில் அடுத்தது:',
        'Next number:': 'அடுத்த எண்:',
        'Next:': 'அடுத்தது:',
        'What is next:': 'அடுத்தது என்ன:',
        'What is the next term:': 'அடுத்த உறுப்பு என்ன:',
        'Look at the differences between consecutive numbers': 'தொடர்ச்சியான எண்களுக்கிடையேயான வேறுபாடுகளைப் பாருங்கள்',
        'Look at the differences between consecutive numbers — they form their own pattern': 'தொடர்ச்சியான எண்களின் வேறுபாடுகளைப் பாருங்கள் — அவை ஒரு வடிவத்தை உருவாக்குகின்றன',
        'Each number is the sum of the two preceding ones': 'ஒவ்வொரு எண்ணும் முந்தைய இரண்டின் கூட்டுத்தொகை',
        'Each number is multiplied by the same factor': 'ஒவ்வொரு எண்ணும் ஒரே காரணியால் பெருக்கப்படுகிறது',
        'These are perfect squares': 'இவை முழு வர்க்கங்கள்',
        'These are perfect cubes': 'இவை முழு கனங்கள்',
        'Differences form a pattern': 'வேறுபாடுகள் ஒரு வடிவத்தை உருவாக்குகின்றன',
        'The differences between consecutive terms increase by': 'தொடர்ச்சியான உறுப்புகளின் வேறுபாடுகள் அதிகரிக்கின்றன',
        'The next difference is': 'அடுத்த வேறுபாடு',
        'giving us': 'இது தருகிறது',
    },
    bn: {
        'What is the next number in:': 'এই ধারায় পরবর্তী সংখ্যা কত:',
        'What is the next number in the series:': 'এই ধারায় পরবর্তী সংখ্যা কত:',
        'What comes next:': 'পরবর্তী কী:',
        'Find the next number:': 'পরবর্তী সংখ্যা খুঁজুন:',
        'Find the next:': 'পরবর্তীটি খুঁজুন:',
        'Find the missing number:': 'অনুপস্থিত সংখ্যা খুঁজুন:',
        'Find:': 'খুঁজুন:',
        'Complete:': 'সম্পূর্ণ করুন:',
        'Next in sequence:': 'ক্রমে পরবর্তী:',
        'Next number:': 'পরবর্তী সংখ্যা:',
        'Next:': 'পরবর্তী:',
        'What is next:': 'পরবর্তী কী:',
        'What is the next term:': 'পরবর্তী পদ কী:',
        'Look at the differences between consecutive numbers': 'পরপর সংখ্যাগুলির পার্থক্য দেখুন',
        'Look at the differences between consecutive numbers — they form their own pattern': 'পরপর সংখ্যাগুলির পার্থক্য দেখুন — তারা নিজস্ব প্যাটার্ন তৈরি করে',
        'The differences between consecutive terms increase by': 'পরপর পদগুলির পার্থক্য বাড়ে',
        'The next difference is': 'পরবর্তী পার্থক্য হলো',
        'giving us': 'যা দেয়',
    },
    mr: {
        'What is the next number in:': 'या मालिकेतील पुढील संख्या कोणती:',
        'What is the next number in the series:': 'या मालिकेतील पुढील संख्या कोणती:',
        'What comes next:': 'पुढील काय:',
        'Find the next number:': 'पुढील संख्या शोधा:',
        'Find the next:': 'पुढील शोधा:',
        'Find the missing number:': 'गहाळ संख्या शोधा:',
        'Find:': 'शोधा:',
        'Complete:': 'पूर्ण करा:',
        'Next in sequence:': 'क्रमात पुढचे:',
        'Next number:': 'पुढील संख्या:',
        'Next:': 'पुढील:',
        'What is next:': 'पुढचे काय:',
        'What is the next term:': 'पुढचा पद कोणता:',
        'Look at the differences between consecutive numbers': 'क्रमिक संख्यांमधील फरक पहा',
        'Look at the differences between consecutive numbers — they form their own pattern': 'क्रमिक संख्यांमधील फरक पहा — ते स्वतःचा नमुना तयार करतात',
        'The differences between consecutive terms increase by': 'क्रमिक पदांमधील फरक वाढतो',
        'The next difference is': 'पुढचा फरक आहे',
        'giving us': 'आपल्याला देतो',
    },
    te: {
        'What is the next number in:': 'ఈ శ్రేణిలో తదుపరి సంఖ్య ఏమిటి:',
        'What is the next number in the series:': 'ఈ శ్రేణిలో తదుపరి సంఖ్య ఏమిటి:',
        'What comes next:': 'తదుపరి ఏమిటి:',
        'Find the next number:': 'తదుపరి సంఖ్యను కనుగొనండి:',
        'Find the next:': 'తదుపరిది కనుగొనండి:',
        'Find the missing number:': 'తప్పిపోయిన సంఖ్యను కనుగొనండి:',
        'Find:': 'కనుగొనండి:',
        'Complete:': 'పూర్తి చేయండి:',
        'Next in sequence:': 'శ్రేణిలో తదుపరి:',
        'Next number:': 'తదుపరి సంఖ్య:',
        'Next:': 'తదుపరి:',
        'What is next:': 'తదుపరి ఏమిటి:',
        'What is the next term:': 'తదుపరి పదం ఏమిటి:',
        'Look at the differences between consecutive numbers': 'వరుస సంఖ్యల మధ్య తేడాలను చూడండి',
        'Look at the differences between consecutive numbers — they form their own pattern': 'వరుస సంఖ్యల మధ్య తేడాలను చూడండి — అవి వాటి సొంత నమూనాను ఏర్పరుస్తాయి',
        'The differences between consecutive terms increase by': 'వరుస పదాల మధ్య తేడాలు పెరుగుతాయి',
        'The next difference is': 'తదుపరి తేడా',
        'giving us': 'ఇది ఇస్తుంది',
    },
    kn: {
        'What is the next number in:': 'ಈ ಸರಣಿಯಲ್ಲಿ ಮುಂದಿನ ಸಂಖ್ಯೆ ಏನು:',
        'What is the next number in the series:': 'ಈ ಸರಣಿಯಲ್ಲಿ ಮುಂದಿನ ಸಂಖ್ಯೆ ಏನು:',
        'What comes next:': 'ಮುಂದಿನದು ಏನು:',
        'Find the next number:': 'ಮುಂದಿನ ಸಂಖ್ಯೆ ಕಂಡುಹಿಡಿಯಿರಿ:',
        'Find the next:': 'ಮುಂದಿನದನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ:',
        'Find the missing number:': 'ಕಾಣೆಯಾದ ಸಂಖ್ಯೆ ಕಂಡುಹಿಡಿಯಿರಿ:',
        'Find:': 'ಕಂಡುಹಿಡಿಯಿರಿ:',
        'Complete:': 'ಪೂರ್ಣಗೊಳಿಸಿ:',
        'Next in sequence:': 'ಅನುಕ್ರಮದಲ್ಲಿ ಮುಂದಿನದು:',
        'Next number:': 'ಮುಂದಿನ ಸಂಖ್ಯೆ:',
        'Next:': 'ಮುಂದಿನದು:',
        'What is next:': 'ಮುಂದಿನದು ಏನು:',
        'What is the next term:': 'ಮುಂದಿನ ಪದ ಏನು:',
        'Look at the differences between consecutive numbers': 'ಸತತ ಸಂಖ್ಯೆಗಳ ನಡುವಿನ ವ್ಯತ್ಯಾಸಗಳನ್ನು ನೋಡಿ',
        'Look at the differences between consecutive numbers — they form their own pattern': 'ಸತತ ಸಂಖ್ಯೆಗಳ ನಡುವಿನ ವ್ಯತ್ಯಾಸಗಳನ್ನು ನೋಡಿ — ಅವು ತಮ್ಮದೇ ಮಾದರಿ ರಚಿಸುತ್ತವೆ',
        'The differences between consecutive terms increase by': 'ಸತತ ಪದಗಳ ನಡುವಿನ ವ್ಯತ್ಯಾಸಗಳು ಹೆಚ್ಚಾಗುತ್ತವೆ',
        'The next difference is': 'ಮುಂದಿನ ವ್ಯತ್ಯಾಸ',
        'giving us': 'ಇದು ನೀಡುತ್ತದೆ',
    },
    gu: {
        'What is the next number in:': 'આ શ્રેણીમાં આગળની સંખ્યા શું છે:',
        'What is the next number in the series:': 'આ શ્રેણીમાં આગળની સંખ્યા શું છે:',
        'What comes next:': 'આગળ શું આવે:',
        'Find the next number:': 'આગળની સંખ્યા શોધો:',
        'Find the next:': 'આગળનું શોધો:',
        'Find the missing number:': 'ખૂટતી સંખ્યા શોધો:',
        'Find:': 'શોધો:',
        'Complete:': 'પૂર્ણ કરો:',
        'Next in sequence:': 'ક્રમમાં આગળનું:',
        'Next number:': 'આગળની સંખ્યા:',
        'Next:': 'આગળનું:',
        'What is next:': 'આગળ શું છે:',
        'What is the next term:': 'આગળનો પદ શું છે:',
        'Look at the differences between consecutive numbers': 'ક્રમિક સંખ્યાઓ વચ્ચેના તફાવત જુઓ',
        'Look at the differences between consecutive numbers — they form their own pattern': 'ક્રમિક સંખ્યાઓ વચ્ચેના તફાવત જુઓ — તે પોતાની પેટર્ન બનાવે છે',
        'The differences between consecutive terms increase by': 'ક્રમિક પદો વચ્ચેના તફાવત વધે છે',
        'The next difference is': 'આગળનો તફાવત છે',
        'giving us': 'આપણને આપે છે',
    },
    pa: {
        'What is the next number in:': 'ਇਸ ਲੜੀ ਵਿੱਚ ਅਗਲੀ ਸੰਖਿਆ ਕੀ ਹੈ:',
        'What is the next number in the series:': 'ਇਸ ਲੜੀ ਵਿੱਚ ਅਗਲੀ ਸੰਖਿਆ ਕੀ ਹੈ:',
        'What comes next:': 'ਅਗਲਾ ਕੀ ਹੈ:',
        'Find the next number:': 'ਅਗਲੀ ਸੰਖਿਆ ਲੱਭੋ:',
        'Find the next:': 'ਅਗਲਾ ਲੱਭੋ:',
        'Find the missing number:': 'ਗੁੰਮ ਸੰਖਿਆ ਲੱਭੋ:',
        'Find:': 'ਲੱਭੋ:',
        'Complete:': 'ਪੂਰਾ ਕਰੋ:',
        'Next in sequence:': 'ਕ੍ਰਮ ਵਿੱਚ ਅਗਲਾ:',
        'Next number:': 'ਅਗਲੀ ਸੰਖਿਆ:',
        'Next:': 'ਅਗਲਾ:',
        'What is next:': 'ਅਗਲਾ ਕੀ ਹੈ:',
        'What is the next term:': 'ਅਗਲਾ ਪਦ ਕੀ ਹੈ:',
        'Look at the differences between consecutive numbers': 'ਲਗਾਤਾਰ ਸੰਖਿਆਵਾਂ ਵਿਚਕਾਰ ਫਰਕ ਵੇਖੋ',
        'Look at the differences between consecutive numbers — they form their own pattern': 'ਲਗਾਤਾਰ ਸੰਖਿਆਵਾਂ ਵਿਚਕਾਰ ਫਰਕ ਵੇਖੋ — ਉਹ ਆਪਣਾ ਪੈਟਰਨ ਬਣਾਉਂਦੇ ਹਨ',
        'The differences between consecutive terms increase by': 'ਲਗਾਤਾਰ ਪਦਾਂ ਵਿਚਕਾਰ ਫਰਕ ਵਧਦਾ ਹੈ',
        'The next difference is': 'ਅਗਲਾ ਫਰਕ ਹੈ',
        'giving us': 'ਜੋ ਸਾਨੂੰ ਦਿੰਦਾ ਹੈ',
    },
    ml: {
        'What is the next number in:': 'ഈ ശ്രേണിയിലെ അടുത്ത സംഖ്യ എന്താണ്:',
        'What is the next number in the series:': 'ഈ ശ്രേണിയിലെ അടുത്ത സംഖ്യ എന്താണ്:',
        'What comes next:': 'അടുത്തത് എന്താണ്:',
        'Find the next number:': 'അടുത്ത സംഖ്യ കണ്ടെത്തുക:',
        'Find the next:': 'അടുത്തത് കണ്ടെത്തുക:',
        'Find the missing number:': 'കാണാതായ സംഖ്യ കണ്ടെത്തുക:',
        'Find:': 'കണ്ടെത്തുക:',
        'Complete:': 'പൂർത്തിയാക്കുക:',
        'Next in sequence:': 'ക്രമത്തിലെ അടുത്തത്:',
        'Next number:': 'അടുത്ത സംഖ്യ:',
        'Next:': 'അടുത്തത്:',
        'What is next:': 'അടുത്തത് എന്താണ്:',
        'What is the next term:': 'അടുത്ത പദം എന്താണ്:',
        'Look at the differences between consecutive numbers': 'തുടർച്ചയായ സംഖ്യകളുടെ വ്യത്യാസങ്ങൾ നോക്കുക',
        'Look at the differences between consecutive numbers — they form their own pattern': 'തുടർച്ചയായ സംഖ്യകളുടെ വ്യത്യാസങ്ങൾ നോക്കുക — അവ സ്വന്തം പാറ്റേൺ രൂപപ്പെടുത്തുന്നു',
        'The differences between consecutive terms increase by': 'തുടർച്ചയായ പദങ്ങളുടെ വ്യത്യാസങ്ങൾ വർദ്ധിക്കുന്നു',
        'The next difference is': 'അടുത്ത വ്യത്യാസം',
        'giving us': 'ഇത് നൽകുന്നു',
    },
    es: {
        'What is the next number in:': '¿Cuál es el siguiente número en:',
        'What is the next number in the series:': '¿Cuál es el siguiente número en la serie:',
        'What comes next:': '¿Qué sigue:',
        'Find the next number:': 'Encuentra el siguiente número:',
        'Find the next:': 'Encuentra el siguiente:',
        'Find the missing number:': 'Encuentra el número faltante:',
        'Find:': 'Encuentra:',
        'Complete:': 'Completa:',
        'Next in sequence:': 'Siguiente en la secuencia:',
        'Next number:': 'Siguiente número:',
        'Next:': 'Siguiente:',
        'What is next:': '¿Cuál es el siguiente:',
        'What is the next term:': '¿Cuál es el siguiente término:',
        'Look at the differences between consecutive numbers': 'Mira las diferencias entre números consecutivos',
        'Look at the differences between consecutive numbers — they form their own pattern': 'Mira las diferencias entre números consecutivos — forman su propio patrón',
        'The differences between consecutive terms increase by': 'Las diferencias entre términos consecutivos aumentan en',
        'The next difference is': 'La siguiente diferencia es',
        'giving us': 'dándonos',
    },
    fr: {
        'What is the next number in:': 'Quel est le prochain nombre dans :',
        'What is the next number in the series:': 'Quel est le prochain nombre dans la série :',
        'What comes next:': 'Que vient ensuite :',
        'Find the next number:': 'Trouvez le prochain nombre :',
        'Find the next:': 'Trouvez le suivant :',
        'Find the missing number:': 'Trouvez le nombre manquant :',
        'Find:': 'Trouvez :',
        'Complete:': 'Complétez :',
        'Next in sequence:': 'Suivant dans la séquence :',
        'Next number:': 'Prochain nombre :',
        'Next:': 'Suivant :',
        'What is next:': 'Quel est le suivant :',
        'What is the next term:': 'Quel est le prochain terme :',
        'Look at the differences between consecutive numbers': 'Regardez les différences entre les nombres consécutifs',
        'Look at the differences between consecutive numbers — they form their own pattern': 'Regardez les différences entre les nombres consécutifs — ils forment leur propre motif',
        'The differences between consecutive terms increase by': 'Les différences entre termes consécutifs augmentent de',
        'The next difference is': 'La prochaine différence est',
        'giving us': 'nous donnant',
    },
    ar: {
        'What is the next number in:': 'ما هو الرقم التالي في:',
        'What is the next number in the series:': 'ما هو الرقم التالي في السلسلة:',
        'What comes next:': 'ما التالي:',
        'Find the next number:': 'أوجد الرقم التالي:',
        'Find the next:': 'أوجد التالي:',
        'Find the missing number:': 'أوجد الرقم المفقود:',
        'Find:': 'أوجد:',
        'Complete:': 'أكمل:',
        'Next in sequence:': 'التالي في التسلسل:',
        'Next number:': 'الرقم التالي:',
        'Next:': 'التالي:',
        'What is next:': 'ما التالي:',
        'What is the next term:': 'ما الحد التالي:',
        'Look at the differences between consecutive numbers': 'انظر إلى الفروق بين الأرقام المتتالية',
        'Look at the differences between consecutive numbers — they form their own pattern': 'انظر إلى الفروق بين الأرقام المتتالية — تشكل نمطها الخاص',
        'The differences between consecutive terms increase by': 'الفروق بين الحدود المتتالية تزداد بمقدار',
        'The next difference is': 'الفرق التالي هو',
        'giving us': 'مما يعطينا',
    },
    zh: {
        'What is the next number in:': '下一个数字是什么:',
        'What is the next number in the series:': '这个序列的下一个数字是什么:',
        'What comes next:': '接下来是什么:',
        'Find the next number:': '找出下一个数字:',
        'Find the next:': '找出下一个:',
        'Find the missing number:': '找出缺失的数字:',
        'Find:': '找出:',
        'Complete:': '完成:',
        'Next in sequence:': '序列中的下一个:',
        'Next number:': '下一个数字:',
        'Next:': '下一个:',
        'What is next:': '下一个是什么:',
        'What is the next term:': '下一项是什么:',
        'Look at the differences between consecutive numbers': '看连续数字之间的差异',
        'Look at the differences between consecutive numbers — they form their own pattern': '看连续数字之间的差异——它们形成自己的规律',
        'The differences between consecutive terms increase by': '连续项之间的差异增加了',
        'The next difference is': '下一个差异是',
        'giving us': '给我们',
    },
    ja: {
        'What is the next number in:': '次の数は何ですか:',
        'What is the next number in the series:': 'この数列の次の数は何ですか:',
        'What comes next:': '次は何ですか:',
        'Find the next number:': '次の数を求めなさい:',
        'Find the next:': '次を求めなさい:',
        'Find the missing number:': '欠けている数を求めなさい:',
        'Find:': '求めなさい:',
        'Complete:': '完成させなさい:',
        'Next in sequence:': '次の項:',
        'Next number:': '次の数:',
        'Next:': '次:',
        'What is next:': '次は何ですか:',
        'What is the next term:': '次の項は何ですか:',
        'Look at the differences between consecutive numbers': '連続する数の差を見てください',
        'Look at the differences between consecutive numbers — they form their own pattern': '連続する数の差を見てください——独自のパターンを形成しています',
        'The differences between consecutive terms increase by': '連続する項の差は増加します',
        'The next difference is': '次の差は',
        'giving us': 'これにより',
    },
    pt: {
        'What is the next number in:': 'Qual é o próximo número em:',
        'What is the next number in the series:': 'Qual é o próximo número na série:',
        'What comes next:': 'O que vem a seguir:',
        'Find the next number:': 'Encontre o próximo número:',
        'Find the next:': 'Encontre o próximo:',
        'Find the missing number:': 'Encontre o número que falta:',
        'Find:': 'Encontre:',
        'Complete:': 'Complete:',
        'Next in sequence:': 'Próximo na sequência:',
        'Next number:': 'Próximo número:',
        'Next:': 'Próximo:',
        'What is next:': 'Qual é o próximo:',
        'What is the next term:': 'Qual é o próximo termo:',
        'Look at the differences between consecutive numbers': 'Olhe as diferenças entre números consecutivos',
        'Look at the differences between consecutive numbers — they form their own pattern': 'Olhe as diferenças entre números consecutivos — eles formam seu próprio padrão',
        'The differences between consecutive terms increase by': 'As diferenças entre termos consecutivos aumentam em',
        'The next difference is': 'A próxima diferença é',
        'giving us': 'nos dando',
    },
};

// ─── Translation Engine ─────────────────────────────────────────────────────

/**
 * Translates a text string to the target language using phrase-level matching.
 * Numbers and math symbols are preserved.
 */
function translateText(text, lang) {
    if (!text || typeof text !== 'string') return text || '';
    const dict = translations[lang];
    if (!dict) return text; // no translation available, return original

    let result = text;

    // Sort keys by length (longest first) to avoid partial matches
    const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);

    for (const phrase of sortedKeys) {
        if (result.includes(phrase)) {
            result = result.split(phrase).join(dict[phrase]);
        }
    }

    return result;
}

// ─── Generate Localized Questions ───────────────────────────────────────────

const targetLanguages = Object.keys(translations); // all languages except 'en'

console.log(`\n🌍 Generating localized questions for ${targetLanguages.length} languages...`);
console.log(`📚 Processing ${questions.length} questions...\n`);

const localizedQuestions = questions.map((q, idx) => {
    const entry = {
        id: q.id,
    };

    for (const lang of targetLanguages) {
        entry[lang] = {
            question: translateText(q.question || '', lang),
            options: q.options || [], // Options are numbers — keep as-is!
            hint: translateText(q.hint || '', lang),
            solution: q.solution || '', // Numbers stay the same
            explanation: translateText(q.explanation || '', lang),
        };
    }

    if ((idx + 1) % 100 === 0) {
        console.log(`  ✅ Processed ${idx + 1}/${questions.length} questions`);
    }

    return entry;
});

// Write output
const outputPath = path.join(__dirname, '..', 'src', 'data', 'localized_questions.json');
fs.writeFileSync(outputPath, JSON.stringify(localizedQuestions, null, 2), 'utf8');

console.log(`\n✨ Done! Generated ${localizedQuestions.length} localized questions.`);
console.log(`📄 Output: ${outputPath}`);
console.log(`🗣️  Languages: ${targetLanguages.join(', ')}`);
console.log(`\n⚠️  Numbers are preserved in 1,2,3,4... format.`);
console.log(`⚠️  Ranking system is unaffected — scores are language-independent.\n`);
