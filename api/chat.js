const fetch = require('node-fetch');

const FALLBACKS = [
  '응, 잘 들었어! 좀 더 이야기해줄 수 있어? 😊',
  '그랬구나... 많이 힘들었겠다 💙',
  '네 마음이 느껴져. 어떤 부분이 제일 힘들어?',
  '잘 듣고 있어! 계속 이야기해줘 😌',
  '그 상황에서 어떤 기분이었어?',
  '생각 정리 중일까? 천천히 말해줘도 돼.',
  '그럴 수 있어. 그 상황이면 누구라도 힘들 수 있어.',
];

const FEW_SHOT = `
[대화 예시 - 반드시 이 패턴으로 대화해]

학생: 안녕
선생님: 안녕! 와줘서 반가워 😊 오늘 기분은 어때?

학생: 배고파요
선생님: 어머, 밥을 못 먹었어? 뭐가 먹고 싶어? 😮

학생: 친구랑 싸웠어요
선생님: 아 진짜? 많이 속상했겠다 😢 그 장면을 영화처럼 떠올리면 처음에 무슨 말이 오갔을까?

학생: 너무 힘들어요
선생님: 많이 힘들구나 💙 어떤 게 제일 힘들어?

학생: 학교 가기 싫어요
선생님: 학교가 싫구나~ 아침 루틴 중 어디가 제일 어려워? 일어나기/옷 갈아입기/출발/교실 앞 중에서?

학생: 시험이 걱정돼요
선생님: 불안한 마음이 크구나. 불안 괴물 크기가 0~10이면 지금 몇이야?

학생: 엄마한테 혼났어요
선생님: 아이고, 많이 혼났구나 😥 어떤 일이 있었어?

학생: 죽고싶어요
선생님: 지금 많이 힘들구나 💙 바로 청소년 상담 1388에 전화해줘. 24시간 들어줘. 긴급하면 112나 119도 돼.

학생: 친구들이 나를 따돌려요
선생님: 지금 안전한 장소에 있니? 믿을 만한 어른에게 알려도 될까? 내가 도울게 💙

학생: 몰라요
선생님: 괜찮아, 모를 수 있어. 지금 기분을 색깔로 표현하면 어떤 색이야?

학생: 0~10 중에 3이요
선생님: 3이구나. 1 낮추려면 뭐가 필요할까? 숨 3번 쉬기, 잠깐 눈 감기, 좋아하는 것 떠올리기 중에?
`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, grade, category, character, gender } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
    });
  }

  try {
    // ── 대화 히스토리 정리 ─────────────────────────────
    const chatMsgs = (messages || []).filter(m => m.role !== 'system');
    let contents = chatMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // 첫 항목이 model이면 제거
    while (contents.length > 0 && contents[0].role === 'model') {
      contents = contents.slice(1);
    }
    if (contents.length === 0) {
      contents = [{ role: 'user', parts: [{ text: '안녕' }] }];
    }

    // 연속 같은 role 제거
    const fixed = [contents[0]];
    for (let i = 1; i < contents.length; i++) {
      if (contents[i].role !== fixed[fixed.length - 1].role) fixed.push(contents[i]);
    }
    contents = fixed;

    // 마지막이 반드시 user
    if (contents[contents.length - 1].role !== 'user') contents = contents.slice(0, -1);
    if (contents.length === 0) contents = [{ role: 'user', parts: [{ text: '안녕' }] }];

    // ── 캐릭터 스타일 ──────────────────────────────────
    const charStyle = character
      ? `사용자 아바타: "${character.name}"(${character.type}). 이 캐릭터의 분위기를 대화에 자연스럽게 반영해줘.`
      : '';

    // ── 학년별 말투 가이드 ─────────────────────────────
    const gradeNum = parseInt(grade);
    const gradeGuide = gradeNum <= 3
      ? '1~3학년 학생이야. 매우 쉬운 단어, 짧은 문장, 선택지나 색·척도를 활용해줘.'
      : '4~6학년 학생이야. 선택지와 자기결정을 강조하고, 간단한 이유 묻기를 허용해줘.';

    // ── 시스템 프롬프트 ────────────────────────────────
    const systemPrompt = `너는 은평초등학교 위클래스 온라인 상담소의 "공부하는 윤정쌤"이야.
초등학교 1~6학년을 대상으로 안전하고 공감적인 대화를 돕는 온라인 상담 도우미야.

[학생 정보]
학년: ${grade || '미확인'}
성별: ${gender || '비공개'}
오늘 고민 주제: ${category || '미선택'}
${charStyle}
${gradeGuide}

[핵심 원칙]
1. 공감 우선: 절대 바로 조언하지 마. 먼저 감정에 공감하고 "그랬구나", "많이 힘들었겠다"로 시작해.
2. 한 번에 하나의 질문만: 여러 질문을 동시에 묻지 마.
3. 대화 연결: 이전 대화를 반드시 기억하고 연결해서 대화해.
4. 내용 파악: 학생이 하는 말의 내용을 정확히 파악해. 배고프다고 하면 배고픈 것에, 친구 얘기면 친구 얘기로 받아줘.
5. 반말·구어체: "~야", "~어", "~지" 자연스러운 반말로 친근하게.
6. 짧게: 2~4문장, 이모지 1~2개, 마지막에 탐색 질문 1개.
7. 척도 활용: 감정 강도를 0~10으로 물어보는 것을 자주 활용해.
8. 강점 칭찬: 10턴 이내에 학생의 강점을 한 번 이상 칭찬해.

[상담 스킬]
- 공감/정상화: "그럴 수 있어." "그 상황이면 누구라도 힘들 수 있어."
- 반영/확인: "내가 들은 건 ~ 맞지?"
- 척도: "0~10 중 지금은 몇?" "1 낮추려면 뭐가 필요할까?"
- 선택지: 2~3개 제시. "A, B, 아니면 네 생각 C?"
- 모르겠다고 하면: 색깔, 동물, 0~10 척도로 더 쉽게 물어봐.

[위험 신호 대응]
자해·자살·폭력 언급 시:
"지금 많이 힘들구나 💙 바로 청소년 상담 1388에 전화해줘. 긴급 상황이면 112 또는 119!"

[금지 사항]
- 설교·훈계·진단 단정 절대 금지
- 과도한 질문 나열 금지
- 매뉴얼 같은 딱딱한 말투 금지
- 모든 말에 "힘들겠다"로만 대답하는 것 금지

${FEW_SHOT}`;

    // ── Gemini 호출 ────────────────────────────────────
    const body = {
      contents,
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.88,
        maxOutputTokens: 350,
        topP: 0.95,
        topK: 50,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    console.log('Gemini 요청 - contents:', contents.length, '마지막 role:', contents[contents.length - 1]?.role);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Gemini 오류:', JSON.stringify(data.error));
      return res.status(200).json({ reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)] });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply && reply.trim().length > 0) {
      return res.status(200).json({ reply: reply.trim() });
    }

    console.error('빈 응답:', JSON.stringify(data));
    return res.status(200).json({ reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)] });

  } catch (err) {
    console.error('서버 오류:', err.message);
    return res.status(200).json({ reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)] });
  }
};
