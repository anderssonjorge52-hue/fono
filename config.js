/* Configuração do Falalá.
   mode: "supabase" usa o banco real; "demo" guarda tudo só neste navegador. */
window.FALALA_CONFIG = {
  mode: "supabase",
  supabaseUrl: "https://urcaaoqyhmeqwfrrdivf.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyY2Fhb3F5aG1lcXdmcnJkaXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyMTY1OTIsImV4cCI6MjExMDc5MjU5Mn0.AczEpv7CulGX3w4xw1vr-xfws2h5lnOQEmUsV_wmaKg",

  // Links de checkout da Wiven (cole aqui quando criar as ofertas)
  checkoutMonthly: "https://checkout.wiven.com.br/checkout/cmwqq03aq0kle01psjudxxkbk?offer=BCIMVBF",
  checkoutAnnual: "https://checkout.wiven.com.br/checkout/cmwqq03aq0kle01psjudxxkbk?offer=RL5YEJL",
  priceMonthly: "R$ 47",
  priceAnnual: "R$ 197",

  // Endereço público do app (ex.: "https://app.falala.online/"). Usado no link da tarefa de casa.
  // Se ficar vazio, o app usa o endereço em que está aberto.
  appUrl: "https://app.usefalala.online/",

  // WhatsApp de suporte, só números com DDI (ex.: 5511999999999)
  supportWhatsapp: "5598988273662"
};
