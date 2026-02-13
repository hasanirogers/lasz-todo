import type { APIRoute } from "astro";
import 'dotenv/config'
import { supabase } from "../../../shared/database";

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.formData();
    // const userId = Number(params.user_id);
    const { data: { user } } = await supabase.auth.getUser();
    const uuid = user?.id;
    const file = body.get('files') as File;

    if (file) {
      const filePath = `${uuid}/${Date.now()}_${file.name}`;

      const { data: storageData, error: storageError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, file);

      if (storageData) {
        const { error: profileError } = await supabase
          .from('Profiles')
          .update({
            avatar: storageData.path
          })
          .eq('uuid', uuid)

        console.log(uuid);

        if (profileError) {
          return new Response(
            JSON.stringify({ success: false, message: "Failed to update profile.", error: profileError }),
            { status: 400 }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: "Uploaded successfully", data: storageData }),
          { status: 200 }
        );
      }

      return new Response(
        JSON.stringify({ success: false, message: "Failed to upload.", error: storageError }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: "No file exists." }),
      { status: 400 }
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ success: false, message: "An internal server error occurred." }),
      { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ params , request }) => {
  try {
    const url = new URL(request.url);
    const origin = url.origin;
    const me = await fetch(`${origin}/api/profile/me`).then(response => response.json());

    // Step 1: List all files in the user's folder
    const { data: files, error: listError } = await supabase
      .storage
      .from('avatars')
      .list(`${me.uuid}`, { limit: 100 });

    if (listError) {
      return new Response(JSON.stringify({ success: false, message: "Failed to list files.", error: listError }), {
        status: 500,
      });
    }

    // Step 2: Construct file paths for deletion
    const filePaths = files.map(file => `${me.uuid.toString()}/${file.name}`);

    console.log('delete profile image', filePaths);

    // Step 3: Delete files
    const { error: storageError } = await supabase
      .storage
      .from('avatars')
      .remove(filePaths);

    // Step 4: Update profile
    const { error: profileError } = await supabase
      .from('Profiles')
      .update({ avatar: null })
      .eq('id', params.user_id);

    if (storageError || profileError) {
      return new Response(
        JSON.stringify({ success: false, message: "Failed to delete avatar.", error: { storageError, profileError } }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Avatar deleted successfully." }),
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, message: "An internal server error occurred." }),
      { status: 500 }
    );
  }
};
