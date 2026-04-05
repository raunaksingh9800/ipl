import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const dataPath = path.join(process.cwd(), 'data.json');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({ toss: 'Pending', match: 'Pending', insight: 'Awaiting alignment.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    let insightText = "Divine insight requires physical alignment.";
    
    if (process.env.GEMINI_API_KEY && body.match && body.match !== "Pending") {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Act as an authoritative, cryptic "Prophet AI" sports oracle. The admin has predicted that "${body.match}" will win today's match. Write 2 short, brutal sentences utilizing data-driven vocabulary (like 'variance', 'probabilistic collapse', or 'momentum algorithms') to convince the user of this inevitable outcome. No fluff. Just absolute certainty about their victory.`;
        
        const result = await model.generateContent(prompt);
        insightText = result.response.text();
      } catch(e) {
        console.error("Gemini failed", e);
        insightText = "The algorithmic probability overwhelmingly favors " + body.match + " due to systemic variance collapsing in their favor.";
      }
    }
    
    body.insight = insightText;

    fs.writeFileSync(dataPath, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
  }
}
