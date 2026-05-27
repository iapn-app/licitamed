export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://licitamed.vercel.app',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const termo = url.searchParams.get('q') || '';
    const tipo = url.searchParams.get('tipo') || 'produto';

    if (!termo) {
      return new Response(JSON.stringify({ error: 'Parâmetro q é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anvisaBase = tipo === 'medicamento'
      ? 'https://consultas.anvisa.gov.br/api/consulta/medicamentos/'
      : 'https://consultas.anvisa.gov.br/api/consulta/produtosHospitalares/';

    const isNumero = /^\d{7,}$/.test(termo.replace(/\D/g, '')) && termo.replace(/\D/g, '').length > 6;
    const filterKey = isNumero ? 'filter[numeroRegistro]' : 'filter[nomeProduto]';
    const anvisaUrl = `${anvisaBase}?count=20&${encodeURIComponent(filterKey)}=${encodeURIComponent(termo)}`;

    try {
      const response = await fetch(anvisaUrl, {
        headers: {
          'Authorization': 'Guest',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://consultas.anvisa.gov.br/',
          'Origin': 'https://consultas.anvisa.gov.br',
        },
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: `ANVISA retornou ${response.status}` }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        return new Response(JSON.stringify({ error: 'ANVISA não retornou JSON' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
