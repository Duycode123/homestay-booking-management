export interface Env {
  AI: Ai;
  BACKEND_BASE_URL: string;
  MODEL_NAME: string;
}

type ChatRequest = {
  message?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type Room = {
  id: number;
  roomName: string;
  roomType?: {
    id: number;
    typeName: string;
    description?: string | null;
    pricePerHour?: number | string | null;
    capacity?: number | null;
  } | null;
  floor?: number | null;
  maxPeople?: number | null;
  status?: string | null;
  description?: string | null;
  imageUrl?: string | null;
};

type ChatResponse = {
  answer: string;
  model: string;
  roomCount: number;
  suggestedRooms: Room[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/health") {
        return ok("Cloudflare AI Worker dang chay", {
          model: env.MODEL_NAME,
          backendBaseUrl: env.BACKEND_BASE_URL
        });
      }

      if (request.method === "GET" && url.pathname === "/suggested-questions") {
        return ok("Lay cau hoi goi y thanh cong", [
          "Phong nao re nhat hien tai?",
          "Toi di 4 nguoi, nen chon phong nao?",
          "Co phong nao duoi 200k khong?",
          "Phong nao phu hop cho band 6 nguoi?",
          "Toi muon dat phong toi nay, co phong nao trong khong?",
          "Tu van phong gia tot cho sinh vien",
          "Phong nao phu hop de tap guitar va trong?",
          "Co phong nao dang trong khong?"
        ]);
      }

      if (request.method === "POST" && url.pathname === "/chat") {
        return handleChat(request, env);
      }

      return fail("Endpoint khong ton tai", 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Loi khong xac dinh";
      return fail(`Loi Worker: ${message}`, 500);
    }
  }
};

async function handleChat(request: Request, env: Env): Promise<Response> {
  let body: ChatRequest;

  try {
    body = await request.json();
  } catch {
    return fail("Body phai la JSON", 400);
  }

  const message = body.message?.trim();
  if (!message) {
    return fail("message khong duoc de trong", 400);
  }

  const rooms = await fetchRooms(env);
  const roomContext = buildRoomContext(rooms);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(roomContext, message);

  const aiResult = await env.AI.run(env.MODEL_NAME, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    max_tokens: 700,
    temperature: 0.25
  });

  const answer = extractAnswer(aiResult);

  const data: ChatResponse = {
    answer,
    model: env.MODEL_NAME,
    roomCount: rooms.length,
    suggestedRooms: pickSuggestedRooms(message, rooms)
  };

  return ok("AI tu van thanh cong", data);
}

function buildSystemPrompt(): string {
  return `
Ban la tro ly AI tu van dat phong homestay nhac cho he thong Homestay Booking Management.

Quy tac bat buoc:
- Tra loi bang tieng Viet than thien, ro rang, de hieu.
- Chi duoc dua tren du lieu phong ma he thong cung cap.
- Khong duoc bia them phong, gia, lich trong hoac thong tin khong co trong du lieu.
- Neu khong co phong phu hop, noi ro hien chua co phong phu hop.
- Neu du lieu suc chua dang thieu/null, noi ro he thong chua co du lieu suc chua va tu van theo gia/trang thai truoc.
- Neu khach hoi lich trong nhung chua noi ngay/gio, hay hoi lai ngay, gio bat dau va gio ket thuc.
- Uu tien phong co trang thai TRONG neu khach muon dat ngay.
- Neu co nhieu phong phu hop, goi y toi da 3 phong tot nhat.
- Luon giai thich ngan gon vi sao goi y phong do.
- Khong dung tu ngu ky thuat nhu API, database, backend khi tra loi khach.

Muc tieu:
Giup khach hang chon phong phu hop theo so nguoi, gia tien, nhu cau tap luyen va tinh trang phong.
`.trim();
}

function buildUserPrompt(roomContext: string, message: string): string {
  return `
Du lieu phong that tu he thong:
${roomContext}

Cau hoi cua khach hang:
${message}

Hay tra loi dua tren du lieu tren. Neu thieu thong tin, hay hoi lai khach mot cach than thien.
`.trim();
}

async function fetchRooms(env: Env): Promise<Room[]> {
  const response = await fetch(`${env.BACKEND_BASE_URL}/api/rooms`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Khong lay duoc du lieu phong tu backend, status ${response.status}`);
  }

  const jsonResponse = await response.json<ApiResponse<Room[]>>();

  if (!jsonResponse.success || !Array.isArray(jsonResponse.data)) {
    throw new Error("Backend tra du lieu phong khong hop le");
  }

  return jsonResponse.data;
}

function buildRoomContext(rooms: Room[]): string {
  if (rooms.length === 0) {
    return "Hien chua co phong nao trong he thong.";
  }

  return rooms.map((room) => {
    const price = formatPrice(room.roomType?.pricePerHour);
    const capacity = room.roomType?.capacity ?? room.maxPeople ?? "chua co du lieu";
    const typeName = room.roomType?.typeName ?? "chua co loai phong";
    const description = room.description || room.roomType?.description || "khong co mo ta";

    return [
      `ID: ${room.id}`,
      `Ten phong: ${room.roomName}`,
      `Loai phong: ${typeName}`,
      `Gia moi gio: ${price}`,
      `Suc chua: ${capacity}`,
      `Trang thai: ${room.status ?? "chua ro"}`,
      `Mo ta: ${description}`
    ].join(" | ");
  }).join("\n");
}

function pickSuggestedRooms(message: string, rooms: Room[]): Room[] {
  const requestedBudget = extractBudget(message.toLowerCase());
  const requestedPeople = extractPeople(message.toLowerCase());

  return rooms
    .filter((room) => {
      const price = Number(room.roomType?.pricePerHour ?? Number.MAX_SAFE_INTEGER);
      const capacity = Number(room.roomType?.capacity ?? room.maxPeople ?? 0);
      const available = !room.status || room.status === "TRONG";

      if (!available) {
        return false;
      }

      if (requestedBudget !== null && price > requestedBudget) {
        return false;
      }

      if (requestedPeople !== null && capacity > 0 && capacity < requestedPeople) {
        return false;
      }

      return true;
    })
    .sort((a, b) => Number(a.roomType?.pricePerHour ?? 0) - Number(b.roomType?.pricePerHour ?? 0))
    .slice(0, 3);
}

function extractBudget(message: string): number | null {
  const kMatch = message.match(/(?:duoi|dưới|<=|<)\s*(\d+)\s*k/);
  if (kMatch?.[1]) {
    return Number(kMatch[1]) * 1000;
  }

  const numberMatch = message.match(/(?:duoi|dưới|<=|<)\s*(\d{5,})/);
  if (numberMatch?.[1]) {
    return Number(numberMatch[1]);
  }

  return null;
}

function extractPeople(message: string): number | null {
  const match = message.match(/(\d+)\s*(nguoi|người|ban|bạn|member|thanh vien|thành viên)/);
  return match?.[1] ? Number(match[1]) : null;
}

function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === "") {
    return "chua co gia";
  }

  const numberPrice = Number(price);
  if (Number.isNaN(numberPrice)) {
    return String(price);
  }

  return `${numberPrice.toLocaleString("vi-VN")} VND`;
}

function extractAnswer(aiResult: unknown): string {
  if (typeof aiResult === "string") {
    return aiResult;
  }

  if (aiResult && typeof aiResult === "object") {
    const result = aiResult as Record<string, unknown>;

    if (typeof result.response === "string") {
      return result.response;
    }

    if (typeof result.result === "string") {
      return result.result;
    }
  }

  return "Xin loi, minh chua tao duoc cau tra loi phu hop.";
}

function ok<T>(message: string, data: T): Response {
  return json({
    success: true,
    message,
    data
  });
}

function fail(message: string, status = 400): Response {
  return json({
    success: false,
    message,
    data: null
  }, status);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders
    }
  });
}
