import type { APIRoute } from "astro";
import 'dotenv/config'
import { supabase, supabaseAdmin } from "../../../shared/database";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({ success: false, message: "You are not logged in." }),
        { status: 400 }
      );
    }

    console.log(session.user);

    const { data: profile, error: profileError } = await supabase
      .from('Profiles')
      .select('*')
      .eq('uuid', session.user.id)
      .single();

    console.log(profile);

    if (profile) {
      const data = { ...profile };
      return new Response(
        JSON.stringify(data),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: "Failed to get profile.", errors: { profileError } }),
      { status: 400 }
    );
  } catch(error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, message: "An internal server error occurred." }),
      { status: 500 })
  }
}

export const DELETE: APIRoute = async () => {
  try {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (!session) {
      console.log(sessionError);
      return new Response(
        JSON.stringify({ success: false, message: "You are not logged in.", error: sessionError }),
        { status: 401 }
      )
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(session.user.id);

    if (deleteError) {
      console.log(deleteError);
      return new Response(
        JSON.stringify({ success: false, message: deleteError.message, error: deleteError }),
        { status: 500 }
      )
    }

    // Delete user's avatar files
    // Step 1: List all files in the user's folder
    const { data: files, error: listError } = await supabase
      .storage
      .from('avatars')
      .list(`${session.user.id}`, { limit: 100 });

    if (listError) {
      console.error(listError);
      return new Response(JSON.stringify({ success: false, message: "Failed to list files.", error: listError }), {
        status: 500,
      });
    }

    // Step 2: Construct file paths for deletion
    const filePaths = files.map(file => `${session.user.id.toString()}/${file.name}`);

    // Step 3: Delete files
    if (filePaths.length > 0) {
      const { error: storageError } = await supabase
        .storage
        .from('avatars')
        .remove(filePaths);

      if (storageError) {
        console.log(storageError);
        return new Response(
          JSON.stringify({ success: false, message: "Failed to delete avatar.", error: storageError }),
          { status: 400 }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      { status: 200 }
    );
  } catch(error) {
    console.log(error);
    return new Response(
      JSON.stringify({ success: false, message: "An internal server error occurred." }),
      { status: 500 })
  }
}
