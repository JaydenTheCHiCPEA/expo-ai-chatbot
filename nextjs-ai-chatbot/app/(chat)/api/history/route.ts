import { auth } from '@/app/(auth)/auth';
import {
  getChatsByUserId,
  getAnonymousUserId,
} from '@/lib/db/queries';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/token';

export async function GET(request: Request) {
  const session = await auth();

  let userId = session?.user?.id;

  if (!userId) {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    }
  }

  if (!userId) {
    userId = await getAnonymousUserId();
  }

  const chats = await getChatsByUserId({ id: userId });
  return Response.json(chats);
}