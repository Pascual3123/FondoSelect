const siteUrl = Deno.env.get('SITE_URL')

export const corsHeaders = {
  'Access-Control-Allow-Origin': siteUrl ? new URL(siteUrl).origin : 'https://pascual3123.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
