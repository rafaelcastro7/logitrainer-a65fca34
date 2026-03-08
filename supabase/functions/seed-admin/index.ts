import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const adminEmail = "rafaelcastro7@gmail.com";
    const adminPassword = "Clave123.";

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      // Update password
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: adminPassword, email_confirm: true });
    } else {
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { display_name: "Admin" },
      });
      if (error) throw error;
      userId = newUser.user.id;
    }

    // Ensure profile exists and is approved
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      display_name: "Admin",
      is_approved: true,
      approval_status: "approved",
    });

    // Assign admin role
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" }
    );

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
