exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'GEMINI_API_KEY not configured.' } }),
    };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    // Step 1: list available models
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const listData = await listRes.json();
    if (!listRes.ok) throw new Error(listData.error?.message || 'Failed to list models');

    // Step 2: find first model that supports generateContent
    const available = (listData.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace('models/', ''));

    if (!available.length) throw new Error('No generateContent models available on this API key.');

    // Prefer flash models, then pro
    const preferred = ['flash', 'pro'];
    let chosen = available[0];
    for (const pref of preferred) {
      const found = available.find(m => m.includes(pref));
      if (found) { chosen = found; break; }
    }

    // Step 3: call chosen model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Gemini error');

    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip markdown fences
    text = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();

    // Attempt to repair truncated JSON by closing open structures
    function repairJson(str) {
      try { JSON.parse(str); return str; } catch {}
      let s = str.trimEnd();
      // Remove trailing incomplete key/value
      s = s.replace(/,\s*"[^"]*$/, '').replace(/,\s*$/, '');
      // Count open braces/brackets and close them
      const opens = [];
      let inStr = false, esc = false;
      for (const ch of s) {
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') opens.push('}');
        else if (ch === '[') opens.push(']');
        else if (ch === '}' || ch === ']') opens.pop();
      }
      return s + opens.reverse().join('');
    }

    const repaired = repairJson(text);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: repaired, model: chosen, available }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } }),
    };
  }
};
