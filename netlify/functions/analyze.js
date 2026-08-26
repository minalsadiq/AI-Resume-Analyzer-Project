exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  try {
    const { cvText, question } = JSON.parse(event.body);
    
    // Yahan seedha apni Gemini API key daal dein taake Netlify variable ki tension hi na rahay
    const apiKey = "YOUR_GEMINI_API_KEY_HERE"; 
    
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: "Please put your Gemini API key inside analyze.js file." }) };
    }

    const prompt = question 
      ? `Based on this resume text, answer the user's question concisely.\nResume:\n${cvText}\n\nQuestion: ${question}`
      : `Analyze this resume text and return a strict JSON object (no markdown formatting, just pure JSON starting with { and ending with }) with this exact structure:
      {
        "name": "Full Name",
        "headline": "Professional Title / Headline",
        "experience_tags": ["Tag1", "Tag2", "Tag3"],
        "match_score": 85,
        "subscores": { "skills": 90, "experience": 80, "education": 85, "communication": 88 },
        "skills": [
          {"label": "Python", "pct": 90},
          {"label": "Machine Learning", "pct": 85},
          {"label": "Data Analysis", "pct": 80},
          {"label": "SQL", "pct": 75},
          {"label": "Streamlit", "pct": 85}
        ],
        "recommendations": [
          "Recommendation 1",
          "Recommendation 2",
          "Recommendation 3"
        ]
      }
      Resume Text:
      ${cvText}`;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const resJson = await apiResponse.json();
    if (resJson.error) {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: resJson.error.message }) };
    }

    const rawText = resJson.candidates[0].content.parts[0].text.trim();

    if (question) {
      return { statusCode: 200, body: JSON.stringify({ success: true, reply: rawText }) };
    }

    let cleanJsonStr = rawText;
    if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedData = JSON.parse(cleanJsonStr);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: parsedData })
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
