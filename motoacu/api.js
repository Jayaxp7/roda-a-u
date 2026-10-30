// MotoAçu: conversa com o banco (Supabase REST), sem biblioteca extra.
(function () {
  var cfg = window.MOTOACU || {};

  function configurado() {
    return !!cfg.SUPABASE_URL && !!cfg.SUPABASE_KEY &&
           cfg.SUPABASE_URL.indexOf('COLE_AQUI') === -1 &&
           cfg.SUPABASE_KEY.indexOf('COLE_AQUI') === -1;
  }

  function chamar(metodo, caminho, corpo, extra) {
    var headers = {
      'apikey': cfg.SUPABASE_KEY,
      'Authorization': 'Bearer ' + cfg.SUPABASE_KEY,
      'Content-Type': 'application/json'
    };
    if (extra) for (var k in extra) headers[k] = extra[k];
    return fetch(cfg.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + caminho, {
      method: metodo,
      headers: headers,
      body: corpo ? JSON.stringify(corpo) : undefined
    }).then(function (r) {
      return r.text().then(function (t) {
        var dados = null;
        try { dados = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok) {
          var msg = (dados && (dados.message || dados.hint)) || ('Erro ' + r.status);
          throw new Error(msg);
        }
        return dados;
      });
    });
  }

  window.MotoApi = {
    configurado: configurado,

    // passageiro cria o pedido; devolve o pedido salvo (com id)
    criarPedido: function (p) {
      return chamar('POST', 'pedidos', p, { 'Prefer': 'return=representation' })
        .then(function (rows) { return rows[0]; });
    },

    buscarPedido: function (id) {
      return chamar('GET', 'pedidos?id=eq.' + encodeURIComponent(id) + '&select=*')
        .then(function (rows) { return rows[0] || null; });
    },

    // pedidos esperando motorista (mais antigos primeiro), só das últimas 2 horas
    listarPendentes: function () {
      var desde = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      return chamar('GET', 'pedidos?status=eq.pendente&criado_em=gte.' + encodeURIComponent(desde) +
        '&order=criado_em.asc&select=*');
    },

    // aceita só se ainda estiver pendente (evita dois motoristas pegarem o mesmo pedido).
    // devolve o pedido, ou null se outro motorista chegou primeiro.
    aceitarPedido: function (id, motorista) {
      return chamar('PATCH', 'pedidos?id=eq.' + encodeURIComponent(id) + '&status=eq.pendente', {
        status: 'aceito',
        motorista_nome: motorista.nome,
        motorista_tel: motorista.tel,
        atualizado_em: new Date().toISOString()
      }, { 'Prefer': 'return=representation' }).then(function (rows) { return rows && rows[0] ? rows[0] : null; });
    },

    // motorista manda a posição dele (só enquanto a corrida está ativa)
    enviarPosicao: function (id, lat, lon) {
      return chamar('PATCH', 'pedidos?id=eq.' + encodeURIComponent(id) + '&status=in.(aceito,em_andamento)', {
        motorista_lat: lat,
        motorista_lon: lon,
        motorista_pos_em: new Date().toISOString()
      }, { 'Prefer': 'return=minimal' });
    },

    // histórico do passageiro (identificado pelo WhatsApp salvo no aparelho)
    listarDoPassageiro: function (tel) {
      return chamar('GET', 'pedidos?passageiro_tel=eq.' + encodeURIComponent(tel) +
        '&order=criado_em.desc&limit=30&select=*');
    },

    // corridas concluídas do motorista desde uma data
    listarDoMotorista: function (tel, desdeISO) {
      return chamar('GET', 'pedidos?motorista_tel=eq.' + encodeURIComponent(tel) +
        '&status=eq.concluido&criado_em=gte.' + encodeURIComponent(desdeISO) +
        '&order=criado_em.desc&limit=200&select=*');
    },

    // motorista desistiu: o pedido volta pra fila pra outro motorista pegar
    devolverPedido: function (id) {
      return chamar('PATCH', 'pedidos?id=eq.' + encodeURIComponent(id) + '&status=eq.aceito', {
        status: 'pendente',
        motorista_nome: null,
        motorista_tel: null,
        atualizado_em: new Date().toISOString()
      }, { 'Prefer': 'return=representation' }).then(function (rows) { return rows && rows[0] ? rows[0] : null; });
    },

    // muda o status (só se estiver num dos status permitidos de origem)
    mudarStatus: function (id, novo, deQualquer) {
      var filtro = deQualquer && deQualquer.length ? '&status=in.(' + deQualquer.join(',') + ')' : '';
      return chamar('PATCH', 'pedidos?id=eq.' + encodeURIComponent(id) + filtro, {
        status: novo,
        atualizado_em: new Date().toISOString()
      }, { 'Prefer': 'return=representation' }).then(function (rows) { return rows && rows[0] ? rows[0] : null; });
    }
  };
})();
