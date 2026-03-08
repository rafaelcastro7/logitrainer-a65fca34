import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // SECURITY: Verify the caller is using the service role key
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!authHeader || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow calls with the service role key (not anon key)
    const token = authHeader.replace("Bearer ", "");
    if (token !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Forbidden - service role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    const adminEmail = "rafaelcastro7@gmail.com";
    const adminPassword = "Clave123.";

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
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
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
