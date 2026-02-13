import type { APIRoute } from "astro";
import 'dotenv/config'
import { supabase } from "../../../shared/database";

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  try {
    const url = new URL(request.url);
    const filePath = url.searchParams.get('filePath');

    if (filePath) {
      const { data: { publicUrl } } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath);

      return new Response(
        JSON.stringify(publicUrl),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify(null),
      { status: 201 }
  );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify(false),
      { status: 500 }
    );
  }
}
