const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, grade, category } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // API 키 없을 때 폴백
  if (!apiKey) {
    return res.status(200).json({
      reply: '안녕! 반가워 😊 오늘 어떤 이야기를 하고 싶어?',
    });
  }

  try {
    // system 메시지 분리
    const systemMsg = messages?.find(m => m.role === 'system');
    const chatMessages = messages?.filter(m => m.role !== 'system') || [];

    // Gemini용 대화 변환
    const contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // 시스템 프롬프트 - 최소한의 페르소나만 유지, 나머지는 Gemini 자유 대화
    const systemInstruction = {
      parts: [
        {
          text: systemMsg?.content ||
            `너는 초등학생 아이들과 대화하는 따뜻한 학교 상담 선생님이야.
이름은 "위클래스 김윤정쌤"이야.
아이가 인사하면 자연스럽게 인사받고, 질문하면 친절하게 대답해.
아이의 말에 공감하고, 자연스럽게 대화를 이어가줘.
반말로 친근하게 대화하되, 너무 딱딱하거나 형식적인 말투는 피해.
아이가 힘들다고 하면 먼저 공감하고, 무슨 일인지 부드럽게 물어봐.
이모지를 자연스럽게 1~2개 써서 따뜻하게 표현해줘.
절대로 매뉴얼처럼 딱딱하게 대답하지 마. 그냥 친한 선생님처럼 자연스럽게 대화해.
${grade ? `상담 대상은 ${grade} 학생이야.` : ''}
${category ? `오늘 고민 주제는 "${category}"야.` : ''}`,
        },
      ],
    };

    const body = {
      contents,
      system_instruction: systemInstruction,
      generationConfig: {
        temperature: 0.9,       // 자연스러운 대화를 위해 높임
        maxOutputTokens: 500,   // 충분한 답변 길이
        topP: 0.95,
        topK: 50,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    // 응답 파싱
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply && reply.trim().length > 0) {
      return res.status(200).json({ reply: reply.trim() });
    }

    // Gemini가 빈 응답 보낼 때
    return res.status(200).json({
      reply: '응, 잘 들었어! 더 이야기해줄 수 있어? 😊',
    });

  } catch (err) {
    console.error('Gemini 오류:', err.message);
    return res.status(200).json({
      reply: '잠깐, 선생님이 잠시 생각 중이야 💭 다시 한번 말해줄래?',
    });
  }
};
