"use client";

import { useState } from "react";
import { Save, Building2, Percent, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ConfiguracoesPage() {
  const [empresa, setEmpresa] = useState({
    nome: "POWER MED MATERIAL HOSPITALAR LTDA",
    cnpj: "42.241.234/0001-70",
    email: "powermedadm@gmail.com",
    telefone: "(21) 3795-9747",
    endereco: "Est do Pau Ferro, 480 - Bloco 001 Salas 0401/0402, Pechincha, Rio de Janeiro — RJ, CEP: 22.743-051",
  });

  const [margemPadrao, setMargemPadrao] = useState("20");

  const [templateEmail, setTemplateEmail] = useState(
    `Prezado(a) {NOME_FORNECEDOR},

Solicitamos gentilmente sua cotação de preços para os itens listados abaixo, referentes à licitação:

📋 {NOME_LICITACAO}
🏛️ Órgão: {ORGAO}
📅 Prazo para resposta: {PRAZO}

Para acessar a planilha de cotação, clique no link abaixo:
{LINK_COTACAO}

Qualquer dúvida, estamos à disposição.

Atenciosamente,
{NOME_EMPRESA}`
  );

  const [templateWhatsApp, setTemplateWhatsApp] = useState(
    `Olá, {NOME_FORNECEDOR}! 👋

Somos da *{NOME_EMPRESA}* e gostaríamos de solicitar sua cotação para uma licitação hospitalar.

*Licitação:* {NOME_LICITACAO}
*Órgão:* {ORGAO}
*Prazo:* {PRAZO}

Acesse o link para preencher os preços:
{LINK_COTACAO}

Obrigado! 🙏`
  );

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Configurações</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Dados da empresa e preferências do sistema
        </p>
      </div>

      {/* Empresa */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-4 h-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-900">Dados da Empresa</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Razão Social</label>
            <Input
              value={empresa.nome}
              onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">CNPJ</label>
            <Input
              value={empresa.cnpj}
              onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">E-mail</label>
            <Input
              type="email"
              value={empresa.email}
              onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Telefone</label>
            <Input
              value={empresa.telefone}
              onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Endereço</label>
            <Input
              value={empresa.endereco}
              onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Margem */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Percent className="w-4 h-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-900">Precificação</h2>
        </div>
        <div className="flex items-end gap-4">
          <div className="w-40">
            <label className="text-xs font-medium text-neutral-600 mb-1.5 block">
              Margem padrão desejada (%)
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={margemPadrao}
                onChange={(e) => setMargemPadrao(e.target.value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">%</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 pb-2">
            Aplicada automaticamente ao menor preço obtido nas cotações.
          </p>
        </div>
        <div className="mt-4 p-3 bg-neutral-50 border border-neutral-100 rounded-md">
          <p className="text-xs text-neutral-500">
            Exemplo: compra a R$ 100,00 → proposta a{" "}
            <strong className="text-neutral-700">
              R$ {(100 * (1 + Number(margemPadrao) / 100)).toFixed(2).replace(".", ",")}
            </strong>{" "}
            ({margemPadrao}% de margem)
          </p>
        </div>
      </div>

      {/* Template email */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-900">Template de E-mail</h2>
        </div>
        <p className="text-xs text-neutral-400 mb-4">
          Variáveis disponíveis:{" "}
          {["{NOME_FORNECEDOR}", "{NOME_LICITACAO}", "{ORGAO}", "{PRAZO}", "{LINK_COTACAO}", "{NOME_EMPRESA}"].map((v) => (
            <code key={v} className="bg-neutral-100 px-1 py-0.5 rounded text-[10px] mx-0.5">{v}</code>
          ))}
        </p>
        <textarea
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent resize-none font-mono leading-relaxed"
          rows={12}
          value={templateEmail}
          onChange={(e) => setTemplateEmail(e.target.value)}
        />
      </div>

      {/* Template WhatsApp */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-900">Template WhatsApp</h2>
        </div>
        <p className="text-xs text-neutral-400 mb-4">
          Suporta *negrito*, _itálico_ e emojis. Mesmo conjunto de variáveis do e-mail.
        </p>
        <textarea
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent resize-none font-mono leading-relaxed"
          rows={10}
          value={templateWhatsApp}
          onChange={(e) => setTemplateWhatsApp(e.target.value)}
        />
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}
